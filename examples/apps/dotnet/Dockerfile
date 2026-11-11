FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /out .
# Written by Taglore before docker build; UseStaticFiles serves wwwroot/
COPY release-notes/ ./wwwroot/release-notes/
ENTRYPOINT ["dotnet", "App.dll"]
