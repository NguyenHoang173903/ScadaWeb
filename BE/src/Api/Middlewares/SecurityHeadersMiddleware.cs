namespace Backend.Api.Middlewares;

/// <summary>
/// Adds baseline browser security headers (anti-clickjacking, MIME sniffing,
/// referrer leakage, CSP) to every API response. Headers are applied in
/// <c>OnStarting</c> so they survive <c>Response.Clear()</c> in the exception handler.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    private const string ApiContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

    public Task InvokeAsync(HttpContext context)
    {
        // Swagger UI needs inline scripts/styles; it is only mapped in Development.
        var isSwagger = context.Request.Path.StartsWithSegments("/swagger");

        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "no-referrer";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            if (!isSwagger)
                headers["Content-Security-Policy"] = ApiContentSecurityPolicy;
            headers.Remove("Server");
            headers.Remove("X-Powered-By");
            return Task.CompletedTask;
        });

        return next(context);
    }
}
