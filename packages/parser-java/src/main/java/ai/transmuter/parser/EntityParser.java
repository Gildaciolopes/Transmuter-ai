package ai.transmuter.parser;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.EnumDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.MemberValuePair;
import com.github.javaparser.ast.expr.NormalAnnotationExpr;

public class EntityParser {

    // ─────────── DTOs ───────────

    public static class RelationInfo {
        public String type;        // OneToMany | ManyToOne | ManyToMany | OneToOne
        public String targetClass;
        public String mappedBy;
        public String fieldName;
        public boolean isOwning;
    }

    public static class EnumValue {
        public String name;
        public int ordinal;

        public EnumValue(String name, int ordinal) {
            this.name = name;
            this.ordinal = ordinal;
        }
    }

    public static class FieldInfo {
        public String name;
        public String type;
        public boolean nullable;
        public List<String> annotations;
        public RelationInfo relation;
        public boolean isTransient;

        public FieldInfo(String name, String type, boolean nullable, List<String> annotations,
                         RelationInfo relation, boolean isTransient) {
            this.name = name;
            this.type = type;
            this.nullable = nullable;
            this.annotations = annotations;
            this.relation = relation;
            this.isTransient = isTransient;
        }
    }

    public static class ParseResult {
        public String className;
        public String packageName;
        public String stereotype;  // entity | service | repository | controller | component | dto | enum
        public List<FieldInfo> fields;
        public boolean isEntity;
        public String superClass;
        public List<EnumValue> enumValues;
        public String inheritanceStrategy;

        public ParseResult(String className, String packageName, String stereotype,
                           List<FieldInfo> fields, boolean isEntity) {
            this.className = className;
            this.packageName = packageName;
            this.stereotype = stereotype;
            this.fields = fields;
            this.isEntity = isEntity;
        }
    }

    /** Single-file response — backward compat with /parse */
    public static class ParseResponse {
        public List<ParseResult> entities;
        public String error;

        public ParseResponse(List<ParseResult> entities) {
            this.entities = entities;
        }

        public ParseResponse(String error) {
            this.error = error;
            this.entities = new ArrayList<>();
        }
    }

    /** Multi-file response for /parse/project */
    public static class ProjectParseResponse {
        public List<ParseResult> classes = new ArrayList<>();
        public List<ParseResult> enums = new ArrayList<>();
        public String error;
    }

    // ─────────── Relation annotation names ───────────

    private static final Set<String> RELATION_ANNOTATIONS = new HashSet<>(Arrays.asList(
            "OneToMany", "ManyToOne", "ManyToMany", "OneToOne"
    ));

    // ─────────── Public API ───────────

    /** Parse a single Java source string. Backward-compat with /parse. */
    public ParseResponse parse(String javaSource) {
        try {
            CompilationUnit cu = StaticJavaParser.parse(javaSource);
            String packageName = cu.getPackageDeclaration()
                    .map(pd -> pd.getNameAsString())
                    .orElse("");

            List<ParseResult> results = new ArrayList<>();
            for (ClassOrInterfaceDeclaration clazz : cu.findAll(ClassOrInterfaceDeclaration.class)) {
                if (!clazz.getAnnotationByName("Entity").isPresent()) continue;
                results.add(parseClass(clazz, packageName));
            }
            return new ParseResponse(results);
        } catch (Exception e) {
            return new ParseResponse("Parse error: " + e.getMessage());
        }
    }

    /** Parse a batch of files for /parse/project. */
    public ProjectParseResponse parseProject(List<FileInput> files) {
        ProjectParseResponse response = new ProjectParseResponse();
        try {
            for (FileInput file : files) {
                parseSingleFile(file.content, response);
            }
        } catch (Exception e) {
            response.error = "Project parse error: " + e.getMessage();
        }
        return response;
    }

    // ─────────── Internal helpers ───────────

    private void parseSingleFile(String javaSource, ProjectParseResponse response) {
        CompilationUnit cu;
        try {
            cu = StaticJavaParser.parse(javaSource);
        } catch (Exception e) {
            // Skip unparseable files gracefully
            return;
        }

        String packageName = cu.getPackageDeclaration()
                .map(pd -> pd.getNameAsString())
                .orElse("");

        // Parse enums
        for (EnumDeclaration enumDecl : cu.findAll(EnumDeclaration.class)) {
            ParseResult result = parseEnum(enumDecl, packageName);
            response.enums.add(result);
        }

        // Parse classes
        for (ClassOrInterfaceDeclaration clazz : cu.findAll(ClassOrInterfaceDeclaration.class)) {
            if (clazz.isInterface()) continue;
            ParseResult result = parseClass(clazz, packageName);
            response.classes.add(result);
        }
    }

    private ParseResult parseClass(ClassOrInterfaceDeclaration clazz, String packageName) {
        String className = clazz.getNameAsString();
        String stereotype = detectStereotype(clazz);
        boolean isEntity = stereotype.equals("entity");

        List<FieldInfo> fields = new ArrayList<>();
        for (FieldDeclaration field : clazz.getFields()) {
            for (VariableDeclarator var : field.getVariables()) {
                String fieldName = var.getNameAsString();
                String fieldType = var.getTypeAsString();

                List<String> annotations = new ArrayList<>();
                for (AnnotationExpr ann : field.getAnnotations()) {
                    annotations.add(ann.getNameAsString());
                }

                boolean isTransient = annotations.contains("Transient");
                RelationInfo relation = extractRelation(field, fieldName, fieldType, annotations);
                boolean nullable = (relation != null) ? true : determineNullability(field, annotations);

                fields.add(new FieldInfo(fieldName, fieldType, nullable, annotations, relation, isTransient));
            }
        }

        ParseResult result = new ParseResult(className, packageName, stereotype, fields, isEntity);

        // Superclass
        clazz.getExtendedTypes().stream().findFirst().ifPresent(ext ->
                result.superClass = ext.getNameAsString()
        );

        // @MappedSuperclass
        if (clazz.getAnnotationByName("MappedSuperclass").isPresent()) {
            result.stereotype = "entity"; // treated as entity base
        }

        // @Inheritance(strategy=...)
        clazz.getAnnotationByName("Inheritance").ifPresent(ann -> {
            if (ann instanceof NormalAnnotationExpr normalAnn) {
                for (MemberValuePair pair : normalAnn.getPairs()) {
                    if (pair.getNameAsString().equals("strategy")) {
                        String val = pair.getValue().toString();
                        if (val.contains("SINGLE_TABLE")) result.inheritanceStrategy = "SINGLE_TABLE";
                        else if (val.contains("TABLE_PER_CLASS")) result.inheritanceStrategy = "TABLE_PER_CLASS";
                        else if (val.contains("JOINED")) result.inheritanceStrategy = "JOINED";
                    }
                }
            }
        });

        return result;
    }

    private ParseResult parseEnum(EnumDeclaration enumDecl, String packageName) {
        String className = enumDecl.getNameAsString();
        ParseResult result = new ParseResult(className, packageName, "enum", new ArrayList<>(), false);

        List<EnumValue> enumValues = new ArrayList<>();
        int ordinal = 0;
        for (var entry : enumDecl.getEntries()) {
            enumValues.add(new EnumValue(entry.getNameAsString(), ordinal++));
        }
        result.enumValues = enumValues;
        return result;
    }

    private String detectStereotype(ClassOrInterfaceDeclaration clazz) {
        if (clazz.getAnnotationByName("Entity").isPresent()) return "entity";
        if (clazz.getAnnotationByName("MappedSuperclass").isPresent()) return "entity";
        if (clazz.getAnnotationByName("Service").isPresent()) return "service";
        if (clazz.getAnnotationByName("Repository").isPresent()) return "repository";
        if (clazz.getAnnotationByName("RestController").isPresent()) return "controller";
        if (clazz.getAnnotationByName("Controller").isPresent()) return "controller";
        if (clazz.getAnnotationByName("Component").isPresent()) return "component";

        // Convention fallback: class name ends with Dto or DTO
        String name = clazz.getNameAsString();
        if (name.endsWith("Dto") || name.endsWith("DTO")) return "dto";

        return "component";
    }

    private RelationInfo extractRelation(FieldDeclaration field, String fieldName,
                                         String fieldType, List<String> annotations) {
        String relationType = null;
        for (String ann : annotations) {
            if (RELATION_ANNOTATIONS.contains(ann)) {
                relationType = ann;
                break;
            }
        }
        if (relationType == null) return null;

        RelationInfo rel = new RelationInfo();
        rel.type = relationType;
        rel.fieldName = fieldName;
        rel.targetClass = extractGenericTarget(fieldType);

        // Extract mappedBy attribute if present
        for (AnnotationExpr ann : field.getAnnotations()) {
            if (RELATION_ANNOTATIONS.contains(ann.getNameAsString()) && ann instanceof NormalAnnotationExpr normalAnn) {
                for (MemberValuePair pair : normalAnn.getPairs()) {
                    if (pair.getNameAsString().equals("mappedBy")) {
                        rel.mappedBy = pair.getValue().toString().replace("\"", "");
                    }
                }
            }
        }

        // Ownership rules:
        // ManyToOne: always owning (holds FK)
        // OneToOne without mappedBy: owning
        // OneToMany: never owning (FK is on the other side)
        // ManyToMany without mappedBy: owning (join table)
        rel.isOwning = switch (relationType) {
            case "ManyToOne" -> true;
            case "OneToOne" -> rel.mappedBy == null;
            case "OneToMany" -> false;
            case "ManyToMany" -> rel.mappedBy == null;
            default -> false;
        };

        return rel;
    }

    /** Strip generic type params: "List<Order>" → "Order", "Order" → "Order" */
    private String extractGenericTarget(String type) {
        int start = type.indexOf('<');
        if (start >= 0) {
            int end = type.lastIndexOf('>');
            if (end > start) {
                return type.substring(start + 1, end).trim();
            }
        }
        return type.trim();
    }

    private boolean determineNullability(FieldDeclaration field, List<String> annotations) {
        // @Id fields with @GeneratedValue are auto-generated
        if (annotations.contains("Id")) {
            return true;
        }

        // Check @Column(nullable = false)
        Optional<AnnotationExpr> columnAnn = field.getAnnotationByName("Column");
        if (columnAnn.isPresent() && columnAnn.get() instanceof NormalAnnotationExpr normalAnn) {
            for (MemberValuePair pair : normalAnn.getPairs()) {
                if (pair.getNameAsString().equals("nullable") &&
                    pair.getValue().toString().equals("false")) {
                    return false;
                }
            }
        }

        return true;
    }

    // ─────────── Request DTOs ───────────

    public static class FileInput {
        public String path;
        public String content;
    }

    public static class ProjectParseRequest {
        public List<FileInput> files;
    }
}
