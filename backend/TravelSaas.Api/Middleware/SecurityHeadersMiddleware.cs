namespace TravelSaas.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _env;

    public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            if (!headers.ContainsKey("X-Content-Type-Options"))
                headers.Append("X-Content-Type-Options", "nosniff");

            if (!headers.ContainsKey("X-Frame-Options"))
                headers.Append("X-Frame-Options", "DENY");

            if (!headers.ContainsKey("X-XSS-Protection"))
                headers.Append("X-XSS-Protection", "0");

            if (!headers.ContainsKey("Referrer-Policy"))
                headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

            if (!headers.ContainsKey("Permissions-Policy"))
                headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

            if (!headers.ContainsKey("Content-Security-Policy"))
            {
                headers.Append("Content-Security-Policy",
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline'; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com data:; " +
                    "img-src 'self' data: https: blob:; " +
                    "connect-src 'self' http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; " +
                    "frame-ancestors 'none';");
            }

            if (!_env.IsDevelopment() && context.Request.IsHttps && !headers.ContainsKey("Strict-Transport-Security"))
            {
                headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}

