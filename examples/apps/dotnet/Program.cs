using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Serves GET /release-notes/latest.json from wwwroot/
app.UseStaticFiles();

// Or read it in code.
var latest = JsonDocument.Parse(File.ReadAllText("wwwroot/release-notes/latest.json")).RootElement;
app.MapGet("/api/version", () => new
{
    version = latest.GetProperty("version").GetString(),
    title = latest.GetProperty("title").GetString(),
});

app.Run();
