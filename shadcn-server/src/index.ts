#!/usr/bin/env node

/**
 * Shadcn/UI MCP Server
 * This MCP server provides tools for managing shadcn/ui components in React projects.
 * It allows you to:
 * - List available shadcn/ui components
 * - Add components to a project
 * - Initialize shadcn/ui in a project
 * - Get component information and usage examples
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Available shadcn/ui components with their descriptions
 */
const SHADCN_COMPONENTS = {
  "accordion": "A vertically stacked set of interactive headings that each reveal a section of content.",
  "alert": "Displays a callout for user attention.",
  "alert-dialog": "A modal dialog that interrupts the user with important content and expects a response.",
  "aspect-ratio": "Displays content within a desired ratio.",
  "avatar": "An image element with a fallback for representing the user.",
  "badge": "Displays a badge or a component that looks like a badge.",
  "breadcrumb": "Displays the path to the current resource using a hierarchy of links.",
  "button": "Displays a button or a component that looks like a button.",
  "calendar": "A date field component that allows users to enter and edit date.",
  "card": "Displays a card with header, content, and footer.",
  "carousel": "A carousel with motion and swipe built using Embla.",
  "chart": "Charts built using Recharts and a simple API.",
  "checkbox": "A control that allows the user to toggle between checked and not checked.",
  "collapsible": "An interactive component which can be expanded/collapsed.",
  "combobox": "Autocomplete input and command palette with a list of suggestions.",
  "command": "Fast, composable, unstyled command menu for React.",
  "context-menu": "Displays a menu to the user — such as a set of actions or functions — triggered by a button.",
  "data-table": "Powerful table and datagrids built using TanStack Table.",
  "date-picker": "A date picker component with range and presets.",
  "dialog": "A window overlaid on either the primary window or another dialog window.",
  "drawer": "A drawer component for React.",
  "dropdown-menu": "Displays a menu to the user — such as a set of actions or functions — triggered by a button.",
  "form": "Building forms with React Hook Form and Zod.",
  "hover-card": "For sighted users to preview content available behind a link.",
  "input": "Displays a form input field or a component that looks like an input field.",
  "input-otp": "Accessible one-time password component with copy paste functionality.",
  "label": "Renders an accessible label associated with controls.",
  "menubar": "A visually persistent menu common in desktop applications.",
  "navigation-menu": "A collection of links for navigating websites.",
  "pagination": "Pagination with page navigation, next and previous links.",
  "popover": "Displays rich content in a portal, triggered by a button.",
  "progress": "Displays an indicator showing the completion progress of a task.",
  "radio-group": "A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.",
  "resizable": "Accessible resizable panel groups and layouts with keyboard support.",
  "scroll-area": "Augments native scroll functionality for custom, cross-browser styling.",
  "select": "Displays a list of options for the user to pick from—triggered by a button.",
  "separator": "Visually or semantically separates content.",
  "sheet": "Extends the Dialog component to display content that complements the main content of the screen.",
  "skeleton": "Use to show a placeholder while content is loading.",
  "slider": "An input where the user selects a value from within a given range.",
  "sonner": "An opinionated toast component for React.",
  "switch": "A control that allows the user to toggle between checked and not checked.",
  "table": "A responsive table component.",
  "tabs": "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  "textarea": "Displays a form textarea or a component that looks like a textarea.",
  "toast": "A succinct message that is displayed temporarily.",
  "toggle": "A two-state button that can be either on or off.",
  "toggle-group": "A set of two-state buttons that can be toggled on or off.",
  "tooltip": "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it."
};

/**
 * Create an MCP server with capabilities for resources and tools.
 */
const server = new Server(
  {
    name: "shadcn-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Execute a command and return the output
 */
function executeCommand(command: string, cwd?: string): string {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Command failed: ${error.message}`
    );
  }
}

/**
 * Check if a directory is a valid React/Next.js project
 */
function isValidProject(projectPath: string): boolean {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return !!(packageJson.dependencies?.react || packageJson.devDependencies?.react);
  } catch {
    return false;
  }
}

/**
 * Check if shadcn/ui is already initialized in the project
 */
function isShadcnInitialized(projectPath: string): boolean {
  const componentsJsonPath = path.join(projectPath, 'components.json');
  return existsSync(componentsJsonPath);
}

/**
 * Handler for listing available resources.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.entries(SHADCN_COMPONENTS).map(([name, description]) => ({
      uri: `shadcn://component/${name}`,
      mimeType: "text/plain",
      name: `${name} component`,
      description: description
    }))
  };
});

/**
 * Handler for reading component information.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const componentName = url.pathname.replace(/^\/component\//, '');
  
  if (!SHADCN_COMPONENTS[componentName as keyof typeof SHADCN_COMPONENTS]) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Component ${componentName} not found`
    );
  }

  const description = SHADCN_COMPONENTS[componentName as keyof typeof SHADCN_COMPONENTS];
  
  return {
    contents: [{
      uri: request.params.uri,
      mimeType: "text/plain",
      text: `Component: ${componentName}\nDescription: ${description}\n\nTo add this component to your project, use the add_component tool with component_name: "${componentName}"`
    }]
  };
});

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "init_shadcn",
        description: "Initialize shadcn/ui in a React project",
        inputSchema: {
          type: "object",
          properties: {
            project_path: {
              type: "string",
              description: "Path to the React project directory (default: current directory)"
            },
            typescript: {
              type: "boolean",
              description: "Use TypeScript (default: true)"
            },
            tailwind: {
              type: "boolean", 
              description: "Use Tailwind CSS (default: true)"
            },
            src_dir: {
              type: "boolean",
              description: "Use src directory (default: true)"
            },
            app_router: {
              type: "boolean",
              description: "Use App Router (Next.js 13+) (default: false)"
            }
          }
        }
      },
      {
        name: "add_component",
        description: "Add a shadcn/ui component to the project",
        inputSchema: {
          type: "object",
          properties: {
            component_name: {
              type: "string",
              description: "Name of the component to add",
              enum: Object.keys(SHADCN_COMPONENTS)
            },
            project_path: {
              type: "string",
              description: "Path to the project directory (default: current directory)"
            }
          },
          required: ["component_name"]
        }
      },
      {
        name: "list_components",
        description: "List all available shadcn/ui components",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "check_project_status",
        description: "Check if shadcn/ui is initialized in the project and show project info",
        inputSchema: {
          type: "object",
          properties: {
            project_path: {
              type: "string",
              description: "Path to the project directory (default: current directory)"
            }
          }
        }
      }
    ]
  };
});

/**
 * Handler for tool execution.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "init_shadcn": {
      const projectPath = (args?.project_path as string) || process.cwd();
      const typescript = (args?.typescript as boolean) ?? true;
      const tailwind = (args?.tailwind as boolean) ?? true;
      const srcDir = (args?.src_dir as boolean) ?? true;
      const appRouter = (args?.app_router as boolean) ?? false;

      if (!isValidProject(projectPath)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Not a valid React project. Make sure package.json exists and React is installed."
        );
      }

      if (isShadcnInitialized(projectPath)) {
        return {
          content: [{
            type: "text",
            text: "shadcn/ui is already initialized in this project."
          }]
        };
      }

      try {
        // Initialize shadcn/ui with the specified options
        const initCommand = `npx shadcn-ui@latest init --yes ${typescript ? '--typescript' : '--javascript'} ${tailwind ? '--tailwind' : ''} ${srcDir ? '--src-dir' : ''} ${appRouter ? '--app' : ''}`;
        
        const output = executeCommand(initCommand, projectPath);
        
        return {
          content: [{
            type: "text",
            text: `Successfully initialized shadcn/ui in the project!\n\nOutput:\n${output}`
          }]
        };
      } catch (error: any) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to initialize shadcn/ui: ${error.message}`
        );
      }
    }

    case "add_component": {
      const componentName = args?.component_name as string;
      const projectPath = (args?.project_path as string) || process.cwd();

      if (!componentName) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "component_name is required"
        );
      }

      if (!SHADCN_COMPONENTS[componentName as keyof typeof SHADCN_COMPONENTS]) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unknown component: ${componentName}. Use list_components to see available components.`
        );
      }

      if (!isValidProject(projectPath)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Not a valid React project. Make sure package.json exists and React is installed."
        );
      }

      if (!isShadcnInitialized(projectPath)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "shadcn/ui is not initialized in this project. Run init_shadcn first."
        );
      }

      try {
        const addCommand = `npx shadcn-ui@latest add ${componentName} --yes`;
        const output = executeCommand(addCommand, projectPath);
        
        return {
          content: [{
            type: "text",
            text: `Successfully added ${componentName} component!\n\nOutput:\n${output}\n\nYou can now import and use the ${componentName} component in your React components.`
          }]
        };
      } catch (error: any) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to add component: ${error.message}`
        );
      }
    }

    case "list_components": {
      const componentList = Object.entries(SHADCN_COMPONENTS)
        .map(([name, description]) => `• ${name}: ${description}`)
        .join('\n');

      return {
        content: [{
          type: "text",
          text: `Available shadcn/ui components:\n\n${componentList}\n\nTotal: ${Object.keys(SHADCN_COMPONENTS).length} components`
        }]
      };
    }

    case "check_project_status": {
      const projectPath = (args?.project_path as string) || process.cwd();

      if (!isValidProject(projectPath)) {
        return {
          content: [{
            type: "text",
            text: "❌ Not a valid React project. Make sure package.json exists and React is installed."
          }]
        };
      }

      const isInitialized = isShadcnInitialized(projectPath);
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      let status = `Project Status for: ${projectPath}\n\n`;
      status += `✅ Valid React project\n`;
      status += `${isInitialized ? '✅' : '❌'} shadcn/ui ${isInitialized ? 'initialized' : 'not initialized'}\n\n`;
      
      status += `Dependencies:\n`;
      if (packageJson.dependencies?.react) {
        status += `• React: ${packageJson.dependencies.react}\n`;
      }
      if (packageJson.dependencies?.['next']) {
        status += `• Next.js: ${packageJson.dependencies['next']}\n`;
      }
      if (packageJson.dependencies?.['@radix-ui/react-slot']) {
        status += `• Radix UI: ${packageJson.dependencies['@radix-ui/react-slot']}\n`;
      }
      if (packageJson.dependencies?.['tailwindcss']) {
        status += `• Tailwind CSS: ${packageJson.dependencies['tailwindcss']}\n`;
      }

      if (isInitialized) {
        status += `\n✨ Ready to add shadcn/ui components!`;
      } else {
        status += `\n💡 Run init_shadcn to get started with shadcn/ui.`;
      }

      return {
        content: [{
          type: "text",
          text: status
        }]
      };
    }

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shadcn/UI MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
