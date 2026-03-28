package ai.transmuter.parser;

import com.google.gson.Gson;

import io.javalin.Javalin;

public class ParserServer {

    public static void main(String[] args) {
        int port = Integer.parseInt(System.getenv().getOrDefault("PARSER_PORT", "4000"));
        EntityParser parser = new EntityParser();
        Gson gson = new Gson();

        Javalin app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> cors.add(it -> it.anyHost()));
        }).start(port);

        app.get("/health", ctx -> {
            ctx.contentType("application/json");
            ctx.result("{\"status\":\"ok\"}");
        });

        // ── Single-file endpoint (backward compat) ──
        app.post("/parse", ctx -> {
            ParseRequest request = gson.fromJson(ctx.body(), ParseRequest.class);
            if (request == null || request.code == null || request.code.isBlank()) {
                ctx.status(400).contentType("application/json");
                ctx.result(gson.toJson(new EntityParser.ParseResponse("Missing 'code' field")));
                return;
            }
            EntityParser.ParseResponse result = parser.parse(request.code);
            ctx.contentType("application/json");
            if (result.error != null) {
                ctx.status(422);
            }
            ctx.result(gson.toJson(result));
        });

        // ── Multi-file project endpoint ──
        app.post("/parse/project", ctx -> {
            EntityParser.ProjectParseRequest request =
                    gson.fromJson(ctx.body(), EntityParser.ProjectParseRequest.class);

            if (request == null || request.files == null || request.files.isEmpty()) {
                ctx.status(400).contentType("application/json");
                EntityParser.ProjectParseResponse errResp = new EntityParser.ProjectParseResponse();
                errResp.error = "Missing 'files' array";
                ctx.result(gson.toJson(errResp));
                return;
            }

            EntityParser.ProjectParseResponse result = parser.parseProject(request.files);
            ctx.contentType("application/json");
            if (result.error != null) {
                ctx.status(422);
            }
            ctx.result(gson.toJson(result));
        });

        System.out.println("Parser service running on port " + port);
    }

    static class ParseRequest {
        String code;
    }
}
