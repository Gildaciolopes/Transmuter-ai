package ai.transmuter.parser;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.MemberValuePair;
import com.github.javaparser.ast.expr.NormalAnnotationExpr;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class EntityParser {

    public static class FieldInfo {
        public String name;
        public String type;
        public boolean nullable;
        public List<String> annotations;

        public FieldInfo(String name, String type, boolean nullable, List<String> annotations) {
            this.name = name;
            this.type = type;
            this.nullable = nullable;
            this.annotations = annotations;
        }
    }

    public static class ParseResult {
        public String className;
        public List<FieldInfo> fields;
        public boolean isEntity;

        public ParseResult(String className, List<FieldInfo> fields, boolean isEntity) {
            this.className = className;
            this.fields = fields;
            this.isEntity = isEntity;
        }
    }

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

    public ParseResponse parse(String javaSource) {
        try {
            CompilationUnit cu = StaticJavaParser.parse(javaSource);
            List<ParseResult> results = new ArrayList<>();

            for (ClassOrInterfaceDeclaration clazz : cu.findAll(ClassOrInterfaceDeclaration.class)) {
                boolean isEntity = clazz.getAnnotationByName("Entity").isPresent();
                if (!isEntity) continue;

                String className = clazz.getNameAsString();
                List<FieldInfo> fields = new ArrayList<>();

                for (FieldDeclaration field : clazz.getFields()) {
                    for (VariableDeclarator var : field.getVariables()) {
                        String fieldName = var.getNameAsString();
                        String fieldType = var.getTypeAsString();

                        List<String> annotations = new ArrayList<>();
                        for (AnnotationExpr ann : field.getAnnotations()) {
                            annotations.add(ann.getNameAsString());
                        }

                        boolean nullable = determineNullability(field, annotations);

                        fields.add(new FieldInfo(fieldName, fieldType, nullable, annotations));
                    }
                }

                results.add(new ParseResult(className, fields, true));
            }

            return new ParseResponse(results);
        } catch (Exception e) {
            return new ParseResponse("Parse error: " + e.getMessage());
        }
    }

    private boolean determineNullability(FieldDeclaration field, List<String> annotations) {
        // Fields are nullable by default (Java convention)
        boolean nullable = true;

        // @Id fields with @GeneratedValue are auto-generated, treat as optional in input
        if (annotations.contains("Id")) {
            nullable = true;
        }

        // Check @Column(nullable = false)
        Optional<AnnotationExpr> columnAnn = field.getAnnotationByName("Column");
        if (columnAnn.isPresent() && columnAnn.get() instanceof NormalAnnotationExpr normalAnn) {
            for (MemberValuePair pair : normalAnn.getPairs()) {
                if (pair.getNameAsString().equals("nullable") &&
                    pair.getValue().toString().equals("false")) {
                    nullable = false;
                }
            }
        }

        // If there's no @Column annotation at all, field is nullable
        // If @Column exists but without nullable specification, it's nullable (JPA default)
        return nullable;
    }
}
