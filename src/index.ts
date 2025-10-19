#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Schema for forecast arguments
const GetForecastArgsSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
  longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),
  forecast_days: z.number().min(1).max(16).optional().default(7).describe("Number of forecast days (1-16)"),
});

// Schema for current weather arguments
const GetCurrentWeatherArgsSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
  longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),
});

// Schema for geocoding arguments
const GeocodeArgsSchema = z.object({
  location: z.string().describe("Location name to geocode"),
});

// Format forecast data into readable text
function formatForecast(data: any): string {
  const { latitude, longitude, daily } = data;
  let result = `Weather Forecast for coordinates (${latitude}, ${longitude})\n\n`;
  
  for (let i = 0; i < daily.time.length; i++) {
    result += `Date: ${daily.time[i]}\n`;
    result += `  Temperature: ${daily.temperature_2m_max[i]}°C max, ${daily.temperature_2m_min[i]}°C min\n`;
    result += `  Precipitation: ${daily.precipitation_sum[i]} mm\n`;
    result += `  Wind Speed: ${daily.wind_speed_10m_max[i]} km/h max\n`;
    result += `  Weather Code: ${daily.weather_code[i]}\n\n`;
  }
  
  return result;
}

// Format current weather data
function formatCurrentWeather(data: any): string {
  const { latitude, longitude, current } = data;
  let result = `Current Weather for coordinates (${latitude}, ${longitude})\n\n`;
  result += `Time: ${current.time}\n`;
  result += `Temperature: ${current.temperature_2m}°C\n`;
  result += `Relative Humidity: ${current.relative_humidity_2m}%\n`;
  result += `Precipitation: ${current.precipitation} mm\n`;
  result += `Wind Speed: ${current.wind_speed_10m} km/h\n`;
  result += `Wind Direction: ${current.wind_direction_10m}°\n`;
  result += `Weather Code: ${current.weather_code}\n`;
  
  return result;
}

// API functions
async function getForecast(latitude: number, longitude: number, forecast_days: number = 7): Promise<string> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code");
  url.searchParams.append("forecast_days", forecast_days.toString());
  url.searchParams.append("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open Meteo API error: ${response.statusText}`);
  }

  const data = await response.json();
  return formatForecast(data);
}

async function getCurrentWeather(latitude: number, longitude: number): Promise<string> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("current", "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open Meteo API error: ${response.statusText}`);
  }

  const data = await response.json();
  return formatCurrentWeather(data);
}

async function geocodeLocation(location: string): Promise<string> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.append("name", location);
  url.searchParams.append("count", "5");
  url.searchParams.append("language", "en");
  url.searchParams.append("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    return `No results found for location: ${location}`;
  }

  let result = `Geocoding results for "${location}":\n\n`;
  for (const place of data.results) {
    result += `${place.name}`;
    if (place.admin1) result += `, ${place.admin1}`;
    if (place.country) result += `, ${place.country}`;
    result += `\n  Coordinates: ${place.latitude}, ${place.longitude}\n`;
    if (place.elevation) result += `  Elevation: ${place.elevation}m\n`;
    result += `\n`;
  }

  return result;
}

// Create server instance
const server = new Server(
  {
    name: "open-meteo-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_forecast",
        description: "Get weather forecast for a location using Open Meteo API. Provides daily forecasts including temperature, precipitation, and wind speed.",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude coordinate (-90 to 90)",
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate (-180 to 180)",
              minimum: -180,
              maximum: 180,
            },
            forecast_days: {
              type: "number",
              description: "Number of forecast days (1-16, default: 7)",
              minimum: 1,
              maximum: 16,
              default: 7,
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "get_current_weather",
        description: "Get current weather conditions for a location using Open Meteo API. Provides real-time temperature, humidity, precipitation, and wind information.",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude coordinate (-90 to 90)",
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate (-180 to 180)",
              minimum: -180,
              maximum: 180,
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "geocode",
        description: "Convert a location name to geographic coordinates using Open Meteo Geocoding API. Returns latitude, longitude, and other location details.",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "Location name (e.g., 'London', 'New York', 'Tokyo')",
            },
          },
          required: ["location"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_forecast": {
        const parsed = GetForecastArgsSchema.parse(args);
        const forecast = await getForecast(
          parsed.latitude,
          parsed.longitude,
          parsed.forecast_days
        );
        return {
          content: [{ type: "text", text: forecast }],
        };
      }

      case "get_current_weather": {
        const parsed = GetCurrentWeatherArgsSchema.parse(args);
        const weather = await getCurrentWeather(parsed.latitude, parsed.longitude);
        return {
          content: [{ type: "text", text: weather }],
        };
      }

      case "geocode": {
        const parsed = GeocodeArgsSchema.parse(args);
        const results = await geocodeLocation(parsed.location);
        return {
          content: [{ type: "text", text: results }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      );
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Open Meteo MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
