# Global Weather MCP Server

The Global Weather MCP Server gives AI assistants real-time access to weather data worldwide through the Model Context Protocol. By providing weather information directly, it eliminates the need for web searches, keeping your conversations private while delivering accurate, up-to-date forecasts and conditions. 

When AI assistants need weather data, they typically use web search, which means your location and queries are sent to search engines and tracked. I wanted a way to get accurate weather information in my AI applications without compromising user privacy. The Global Weather MCP Server solves this by providing direct access to weather APIs through MCP, keeping location data and queries private while still delivering real-time forecasts and conditions.

## Features

This MCP server provides three tools for accessing weather data:

- **get_forecast**: Get weather forecast for a location (up to 16 days)
  - Daily temperature (max/min)
  - Precipitation
  - Wind speed
  - Weather codes

- **get_current_weather**: Get current weather conditions
  - Real-time temperature
  - Humidity
  - Precipitation
  - Wind speed and direction
  - Weather code

- **geocode**: Convert location names to coordinates
  - Supports city names, addresses
  - Returns latitude, longitude, elevation
  - Provides up to 5 results

## Installation

```bash
npm install
npm run build
```

## Usage

### With MCP Inspector

You can test this server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

### With Claude Desktop

Add this to your Claude Desktop configuration:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "node",
      "args": ["/absolute/path/to/Open-Meteo-MCP-Server/build/index.js"]
    }
  }
}
```

## Example Usage

Once connected, you can ask Claude:

- "What's the weather forecast for London?"
- "Get current weather for latitude 40.7128, longitude -74.0060"
- "Find coordinates for Tokyo"

## API Documentation

This server uses the following Open Meteo APIs:

- [Weather Forecast API](https://open-meteo.com/en/docs)
- [Geocoding API](https://open-meteo.com/en/docs/geocoding-api)

## Development

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run watch
```

## License

MIT
