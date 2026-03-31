package ai.transmuter.parser;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.EnumDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.RecordDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.MemberValuePair;
import com.github.javaparser.ast.expr.NormalAnnotationExpr;
import com.github.javaparser.ast.expr.SingleMemberAnnotationExpr;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.github.javaparser.ast.type.Type;

public class EntityParser {

    /** Reusable parser configured for Java 17 (supports records, sealed classes, etc.) */
    private static final JavaParser PARSER = new JavaParser(
            new ParserConfiguration().setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_17)
    );

    /** Helper to parse source; returns null on failure. */
    private static CompilationUnit parseSource(String javaSource) {
        com.github.javaparser.ParseResult<CompilationUnit> result = PARSER.parse(javaSource);
        if (!result.isSuccessful() || result.getResult().isEmpty()) return null;
        return result.getResult().get();
    }

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
        /** Generation strategy from @GeneratedValue(strategy=...) — "UUID", "SEQUENCE", "IDENTITY", "AUTO" */
        public String generationStrategy;
        /** Validation constraints extracted from Bean Validation / @Column annotations */
        public Map<String, Object> constraints = new HashMap<>();

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

    public static class ParamInfo {
        public String name;
        public String type;
        /** "path" | "query" | "body" | "header" | "unknown" */
        public String source;
    }

    public static class MethodInfo {
        public String name;
        /** "GET" | "POST" | "PUT" | "DELETE" | "PATCH" */
        public String httpMethod;
        public String path;
        public String returnType;
        public List<ParamInfo> params = new ArrayList<>();
        /** Type of the @RequestBody parameter, if any */
        public String bodyType;
    }

    public static class ParseResult {
        public String className;
        public String packageName;
        /** entity | service | repository | controller | component | dto | enum | exception-handler | configuration | skip */
        public String stereotype;
        public List<FieldInfo> fields;
        public boolean isEntity;
        public String superClass;
        public List<EnumValue> enumValues;
        public String inheritanceStrategy;
        public boolean isMappedSuperclass;
        public String tableName;       // from @Table(name = "...")
        public String requestMapping;  // from @RequestMapping("...")
        /** For repository interfaces: entity type arg, e.g. "Product" in JpaRepository<Product, String> */
        public String entityType;
        /** For repository interfaces: id type arg, e.g. "String" in JpaRepository<Product, String> */
        public String idType;
        /** HTTP methods extracted from controller classes */
        public List<MethodInfo> methods = new ArrayList<>();

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

    // ─────────── Constants ───────────

    private static final Set<String> RELATION_ANNOTATIONS = new HashSet<>(Arrays.asList(
            "OneToMany", "ManyToOne", "ManyToMany", "OneToOne"
    ));

    private static final Set<String> SPRING_REPOSITORY_SUPERTYPES = new HashSet<>(Arrays.asList(
            "JpaRepository", "CrudRepository", "PagingAndSortingRepository",
            "ListCrudRepository", "ListPagingAndSortingRepository", "ReactiveCrudRepository"
    ));

    private static final Map<String, String> HTTP_ANNOTATIONS = new HashMap<>();
    static {
        HTTP_ANNOTATIONS.put("GetMapping", "GET");
        HTTP_ANNOTATIONS.put("PostMapping", "POST");
        HTTP_ANNOTATIONS.put("PutMapping", "PUT");
        HTTP_ANNOTATIONS.put("DeleteMapping", "DELETE");
        HTTP_ANNOTATIONS.put("PatchMapping", "PATCH");
    }

    private static final Set<String> SKIP_SUPERCLASSES = new HashSet<>(Arrays.asList(
            "SpringBootServletInitializer", "WebMvcConfigurer", "WebSecurityConfigurerAdapter",
            "ResourceConfig"
    ));

    // ─────────── Public API ───────────

    /** Parse a single Java source string. Backward-compat with /parse. */
    public ParseResponse parse(String javaSource) {
        try {
            CompilationUnit cu = parseSource(javaSource);
            if (cu == null) return new ParseResponse("Parse error: failed to parse source");
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
            cu = parseSource(javaSource);
            if (cu == null) return;
        } catch (Exception e) {
            return; // Skip unparseable files gracefully
        }

        String packageName = cu.getPackageDeclaration()
                .map(pd -> pd.getNameAsString())
                .orElse("");

        // Parse enums
        for (EnumDeclaration enumDecl : cu.findAll(EnumDeclaration.class)) {
            response.enums.add(parseEnum(enumDecl, packageName));
        }

        // Parse Java records (Java 16+) — treat as DTOs
        for (RecordDeclaration record : cu.findAll(RecordDeclaration.class)) {
            response.classes.add(parseRecord(record, packageName));
        }

        // Parse classes and interfaces
        for (ClassOrInterfaceDeclaration clazz : cu.findAll(ClassOrInterfaceDeclaration.class)) {
            if (clazz.isInterface()) {
                // Only process interfaces that extend Spring Data repository types
                ParseResult repoResult = tryParseRepositoryInterface(clazz, packageName);
                if (repoResult != null) {
                    response.classes.add(repoResult);
                }
                continue;
            }
            ParseResult result = parseClass(clazz, packageName);
            response.classes.add(result);
        }
    }

    // ─────────── Class parsing ───────────

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

                FieldInfo fieldInfo = new FieldInfo(fieldName, fieldType, nullable, annotations, relation, isTransient);

                // Extract @GeneratedValue strategy
                if (annotations.contains("GeneratedValue")) {
                    field.getAnnotationByName("GeneratedValue").ifPresent(ann -> {
                        fieldInfo.generationStrategy = extractGenerationStrategy(ann);
                    });
                    if (fieldInfo.generationStrategy == null) fieldInfo.generationStrategy = "AUTO";
                }

                // Extract validation constraints
                extractConstraints(fieldInfo, field.getAnnotations());

                fields.add(fieldInfo);
            }
        }

        ParseResult result = new ParseResult(className, packageName, stereotype, fields, isEntity);

        // Superclass
        clazz.getExtendedTypes().stream().findFirst().ifPresent(ext ->
                result.superClass = ext.getNameAsString()
        );

        // @MappedSuperclass
        if (clazz.getAnnotationByName("MappedSuperclass").isPresent()) {
            result.stereotype = "entity";
            result.isMappedSuperclass = true;
        }

        // @Table(name = "...")
        clazz.getAnnotationByName("Table").ifPresent(ann -> {
            if (ann instanceof NormalAnnotationExpr normalAnn) {
                for (MemberValuePair pair : normalAnn.getPairs()) {
                    if (pair.getNameAsString().equals("name")) {
                        result.tableName = pair.getValue().toString().replace("\"", "");
                    }
                }
            }
        });

        // @RequestMapping("...") — capture base route for controllers
        clazz.getAnnotationByName("RequestMapping").ifPresent(ann -> {
            if (ann instanceof SingleMemberAnnotationExpr singleAnn) {
                result.requestMapping = singleAnn.getMemberValue().toString().replace("\"", "");
            } else if (ann instanceof NormalAnnotationExpr normalAnn) {
                for (MemberValuePair pair : normalAnn.getPairs()) {
                    if (pair.getNameAsString().equals("value") || pair.getNameAsString().equals("path")) {
                        result.requestMapping = pair.getValue().toString().replace("\"", "");
                    }
                }
            }
        });

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

        // Extract HTTP methods for controllers
        if ("controller".equals(result.stereotype)) {
            result.methods = extractHttpMethods(clazz);
        }

        return result;
    }

    // ─────────── Record parsing ───────────

    private ParseResult parseRecord(RecordDeclaration record, String packageName) {
        String className = record.getNameAsString();
        // Records are almost always DTOs in Spring — default to "dto"
        String stereotype = isDtoName(className) ? "dto" : "dto";

        List<FieldInfo> fields = new ArrayList<>();
        for (Parameter component : record.getParameters()) {
            String fieldName = component.getNameAsString();
            String fieldType = component.getType().asString();

            List<String> annotations = new ArrayList<>();
            for (AnnotationExpr ann : component.getAnnotations()) {
                annotations.add(ann.getNameAsString());
            }

            boolean isTransient = annotations.contains("Transient");
            boolean nullable = determineNullabilityFromAnnotations(annotations);

            FieldInfo fieldInfo = new FieldInfo(fieldName, fieldType, nullable, annotations, null, isTransient);
            extractConstraints(fieldInfo, component.getAnnotations());
            fields.add(fieldInfo);
        }

        return new ParseResult(className, packageName, stereotype, fields, false);
    }

    // ─────────── Interface / repository parsing ───────────

    private ParseResult tryParseRepositoryInterface(ClassOrInterfaceDeclaration iface, String packageName) {
        for (ClassOrInterfaceType extType : iface.getExtendedTypes()) {
            String typeName = extType.getNameAsString();
            if (SPRING_REPOSITORY_SUPERTYPES.contains(typeName)) {
                ParseResult result = new ParseResult(iface.getNameAsString(), packageName, "repository", new ArrayList<>(), false);

                // Extract generic type args: JpaRepository<Product, String>
                extType.getTypeArguments().ifPresent(args -> {
                    if (args.size() >= 1) result.entityType = args.get(0).asString();
                    if (args.size() >= 2) result.idType = args.get(1).asString();
                });

                // Extract custom query method declarations
                for (MethodDeclaration method : iface.getMethods()) {
                    MethodInfo info = new MethodInfo();
                    info.name = method.getNameAsString();
                    info.returnType = method.getType().asString();
                    result.methods.add(info);
                }

                return result;
            }
        }
        return null;
    }

    // ─────────── Enum parsing ───────────

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

    // ─────────── Stereotype detection ───────────

    private String detectStereotype(ClassOrInterfaceDeclaration clazz) {
        // Infrastructure / skip patterns first
        if (clazz.getAnnotationByName("SpringBootApplication").isPresent()) return "skip";
        if (clazz.getAnnotationByName("SpringBootTest").isPresent()) return "skip";

        // Check superclass for known infrastructure types
        for (ClassOrInterfaceType superType : clazz.getExtendedTypes()) {
            if (SKIP_SUPERCLASSES.contains(superType.getNameAsString())) return "skip";
        }

        // Spring component stereotypes
        if (clazz.getAnnotationByName("Entity").isPresent()) return "entity";
        if (clazz.getAnnotationByName("MappedSuperclass").isPresent()) return "entity";
        if (clazz.getAnnotationByName("Service").isPresent()) return "service";
        if (clazz.getAnnotationByName("Repository").isPresent()) return "repository";
        if (clazz.getAnnotationByName("RestController").isPresent()) return "controller";
        if (clazz.getAnnotationByName("Controller").isPresent()) return "controller";
        if (clazz.getAnnotationByName("RestControllerAdvice").isPresent()) return "exception-handler";
        if (clazz.getAnnotationByName("ControllerAdvice").isPresent()) return "exception-handler";
        if (clazz.getAnnotationByName("Configuration").isPresent()) return "configuration";
        if (clazz.getAnnotationByName("Component").isPresent()) return "component";

        // Convention-based DTO detection (name suffix/prefix)
        String name = clazz.getNameAsString();
        if (isDtoName(name)) return "dto";

        // Default: treat as generic component
        return "component";
    }

    private boolean isDtoName(String name) {
        return name.endsWith("Dto") || name.endsWith("DTO")
                || name.endsWith("Request") || name.endsWith("Response")
                || name.endsWith("Form") || name.endsWith("Payload")
                || name.endsWith("Command") || name.endsWith("Body")
                || name.startsWith("Request") || name.startsWith("Response");
    }

    // ─────────── HTTP method extraction (for controllers) ───────────

    private List<MethodInfo> extractHttpMethods(ClassOrInterfaceDeclaration clazz) {
        List<MethodInfo> methods = new ArrayList<>();
        for (MethodDeclaration method : clazz.getMethods()) {
            MethodInfo info = tryExtractHttpMethod(method);
            if (info != null) methods.add(info);
        }
        return methods;
    }

    private MethodInfo tryExtractHttpMethod(MethodDeclaration method) {
        String httpMethod = null;
        String path = "";

        for (AnnotationExpr ann : method.getAnnotations()) {
            String annName = ann.getNameAsString();
            if (HTTP_ANNOTATIONS.containsKey(annName)) {
                httpMethod = HTTP_ANNOTATIONS.get(annName);
                path = extractAnnotationPath(ann);
                break;
            }
            if ("RequestMapping".equals(annName)) {
                httpMethod = "GET"; // default
                path = extractAnnotationPath(ann);
                if (ann instanceof NormalAnnotationExpr normalAnn) {
                    for (MemberValuePair pair : normalAnn.getPairs()) {
                        if ("method".equals(pair.getNameAsString())) {
                            String m = pair.getValue().toString();
                            if (m.contains("POST")) httpMethod = "POST";
                            else if (m.contains("PUT")) httpMethod = "PUT";
                            else if (m.contains("DELETE")) httpMethod = "DELETE";
                            else if (m.contains("PATCH")) httpMethod = "PATCH";
                        }
                    }
                }
                break;
            }
        }

        if (httpMethod == null) return null;

        MethodInfo info = new MethodInfo();
        info.name = method.getNameAsString();
        info.httpMethod = httpMethod;
        info.path = path;
        info.returnType = method.getType().asString();

        for (Parameter param : method.getParameters()) {
            boolean isBody = param.getAnnotationByName("RequestBody").isPresent();
            boolean isPath = param.getAnnotationByName("PathVariable").isPresent();
            boolean isQuery = param.getAnnotationByName("RequestParam").isPresent();
            boolean isHeader = param.getAnnotationByName("RequestHeader").isPresent();

            String paramType = param.getType().asString();
            String paramName = param.getNameAsString();

            if (isBody) {
                info.bodyType = paramType;
                // Body params are encoded in bodyType; don't add to params list
            } else {
                ParamInfo pInfo = new ParamInfo();
                pInfo.name = paramName;
                pInfo.type = paramType;
                pInfo.source = isPath ? "path" : isQuery ? "query" : isHeader ? "header" : "unknown";
                info.params.add(pInfo);
            }
        }

        return info;
    }

    private String extractAnnotationPath(AnnotationExpr ann) {
        if (ann instanceof SingleMemberAnnotationExpr singleAnn) {
            return singleAnn.getMemberValue().toString().replace("\"", "");
        }
        if (ann instanceof NormalAnnotationExpr normalAnn) {
            for (MemberValuePair pair : normalAnn.getPairs()) {
                String k = pair.getNameAsString();
                if ("value".equals(k) || "path".equals(k)) {
                    return pair.getValue().toString().replace("\"", "");
                }
            }
        }
        return "";
    }

    // ─────────── Constraint extraction ───────────

    private void extractConstraints(FieldInfo fieldInfo, NodeList<AnnotationExpr> annotations) {
        for (AnnotationExpr ann : annotations) {
            String annName = ann.getNameAsString();
            switch (annName) {
                case "NotNull"      -> fieldInfo.constraints.put("notNull", true);
                case "NotBlank"     -> fieldInfo.constraints.put("notBlank", true);
                case "NotEmpty"     -> fieldInfo.constraints.put("notEmpty", true);
                case "Email"        -> fieldInfo.constraints.put("email", true);
                case "Positive"     -> fieldInfo.constraints.put("positive", true);
                case "PositiveOrZero" -> fieldInfo.constraints.put("min", 0);
                case "Negative"     -> fieldInfo.constraints.put("negative", true);
                case "Min" -> {
                    Integer val = extractSingleIntValue(ann, "value");
                    if (val != null) fieldInfo.constraints.put("min", val);
                }
                case "Max" -> {
                    Integer val = extractSingleIntValue(ann, "value");
                    if (val != null) fieldInfo.constraints.put("max", val);
                }
                case "Size", "Length" -> {
                    if (ann instanceof NormalAnnotationExpr normalAnn) {
                        for (MemberValuePair pair : normalAnn.getPairs()) {
                            try {
                                int v = Integer.parseInt(pair.getValue().toString());
                                if ("min".equals(pair.getNameAsString())) fieldInfo.constraints.put("sizeMin", v);
                                else if ("max".equals(pair.getNameAsString())) fieldInfo.constraints.put("sizeMax", v);
                            } catch (NumberFormatException ignored) {}
                        }
                    }
                }
                case "Pattern" -> {
                    if (ann instanceof NormalAnnotationExpr normalAnn) {
                        for (MemberValuePair pair : normalAnn.getPairs()) {
                            if ("regexp".equals(pair.getNameAsString())) {
                                fieldInfo.constraints.put("pattern", pair.getValue().toString().replace("\"", ""));
                            }
                        }
                    }
                }
                case "Column" -> {
                    if (ann instanceof NormalAnnotationExpr normalAnn) {
                        for (MemberValuePair pair : normalAnn.getPairs()) {
                            switch (pair.getNameAsString()) {
                                case "length" -> {
                                    try { fieldInfo.constraints.put("columnLength", Integer.parseInt(pair.getValue().toString())); }
                                    catch (NumberFormatException ignored) {}
                                }
                                case "unique" -> {
                                    if ("true".equals(pair.getValue().toString())) fieldInfo.constraints.put("unique", true);
                                }
                                case "precision" -> {
                                    try { fieldInfo.constraints.put("precision", Integer.parseInt(pair.getValue().toString())); }
                                    catch (NumberFormatException ignored) {}
                                }
                                case "scale" -> {
                                    try { fieldInfo.constraints.put("scale", Integer.parseInt(pair.getValue().toString())); }
                                    catch (NumberFormatException ignored) {}
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private Integer extractSingleIntValue(AnnotationExpr ann, String key) {
        try {
            if (ann instanceof SingleMemberAnnotationExpr singleAnn) {
                return Integer.parseInt(singleAnn.getMemberValue().toString());
            }
            if (ann instanceof NormalAnnotationExpr normalAnn) {
                for (MemberValuePair pair : normalAnn.getPairs()) {
                    if (key.equals(pair.getNameAsString())) {
                        return Integer.parseInt(pair.getValue().toString());
                    }
                }
            }
        } catch (NumberFormatException ignored) {}
        return null;
    }

    // ─────────── @GeneratedValue strategy ───────────

    private String extractGenerationStrategy(AnnotationExpr ann) {
        String val = null;
        if (ann instanceof SingleMemberAnnotationExpr singleAnn) {
            val = singleAnn.getMemberValue().toString();
        } else if (ann instanceof NormalAnnotationExpr normalAnn) {
            for (MemberValuePair pair : normalAnn.getPairs()) {
                if ("strategy".equals(pair.getNameAsString())) {
                    val = pair.getValue().toString();
                    break;
                }
            }
        }
        if (val == null) return "AUTO";
        if (val.contains("UUID")) return "UUID";
        if (val.contains("SEQUENCE")) return "SEQUENCE";
        if (val.contains("IDENTITY")) return "IDENTITY";
        return "AUTO";
    }

    // ─────────── JPA relation extraction ───────────

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
                    if ("mappedBy".equals(pair.getNameAsString())) {
                        rel.mappedBy = pair.getValue().toString().replace("\"", "");
                    }
                }
            }
        }

        rel.isOwning = switch (relationType) {
            case "ManyToOne" -> true;
            case "OneToOne"  -> rel.mappedBy == null;
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

    // ─────────── Nullability ───────────

    private static final Set<String> NOT_NULL_ANNOTATIONS = new HashSet<>(Arrays.asList(
            "NotNull", "NotBlank", "NotEmpty"
    ));

    private boolean determineNullability(FieldDeclaration field, List<String> annotations) {
        if (annotations.contains("Id")) return true; // @Id fields are optional on input (auto-generated)

        if (determineNullabilityFromAnnotations(annotations)) {
            // No not-null annotation — check @Column(nullable = false)
            Optional<AnnotationExpr> columnAnn = field.getAnnotationByName("Column");
            if (columnAnn.isPresent() && columnAnn.get() instanceof NormalAnnotationExpr normalAnn) {
                for (MemberValuePair pair : normalAnn.getPairs()) {
                    if ("nullable".equals(pair.getNameAsString()) && "false".equals(pair.getValue().toString())) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

    private boolean determineNullabilityFromAnnotations(List<String> annotations) {
        for (String ann : annotations) {
            if (NOT_NULL_ANNOTATIONS.contains(ann)) return false;
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
