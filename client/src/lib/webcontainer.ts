import { WebContainer } from '@webcontainer/api';
import type { ProjectFile } from '@shared/schema';

export interface TerminalOutput {
  type: 'stdout' | 'stderr';
  data: string;
}

export interface WebContainerStatus {
  isBooting: boolean;
  isInstalling: boolean;
  isStarting: boolean;
  isReady: boolean;
  serverUrl?: string;
  error?: string;
}

export class WebContainerManager {
  private container: WebContainer | null = null;
  private initPromise: Promise<void> | null = null;
  private terminalOutputListeners: Set<(output: TerminalOutput) => void> = new Set();
  private statusListeners: Set<(status: WebContainerStatus) => void> = new Set();
  private status: WebContainerStatus = {
    isBooting: false,
    isInstalling: false,
    isStarting: false,
    isReady: false,
  };

  constructor() {}

  /**
   * Initialize the WebContainer instance
   */
  async init(): Promise<void> {
    if (this.container) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.updateStatus({ isBooting: true });
        this.container = await WebContainer.boot();
        this.updateStatus({ isBooting: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to boot WebContainer';
        this.updateStatus({ 
          isBooting: false, 
          error: errorMessage 
        });
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Mount project files to the WebContainer filesystem
   */
  async mountFiles(files: ProjectFile[]): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not initialized');
    }

    try {
      // Convert flat file array to nested directory structure
      const fileTree = this.buildFileTree(files);
      await this.container.mount(fileTree);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mount files';
      this.updateStatus({ error: errorMessage });
      throw error;
    }
  }

  /**
   * Install npm dependencies
   */
  async installDependencies(): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not initialized');
    }

    try {
      this.updateStatus({ isInstalling: true });
      
      const installProcess = await this.container.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this.emitTerminalOutput({ type: 'stdout', data });
          },
        })
      );

      const exitCode = await installProcess.exit;
      
      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`);
      }

      this.updateStatus({ isInstalling: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to install dependencies';
      this.updateStatus({ 
        isInstalling: false, 
        error: errorMessage 
      });
      throw error;
    }
  }

  /**
   * Start the development server
   */
  async startDevServer(command: string = 'npm run dev'): Promise<string> {
    if (!this.container) {
      throw new Error('WebContainer not initialized');
    }

    try {
      this.updateStatus({ isStarting: true });

      const [cmd, ...args] = command.split(' ');
      const serverProcess = await this.container.spawn(cmd, args);

      serverProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this.emitTerminalOutput({ type: 'stdout', data });
          },
        })
      );

      // Wait for server to be ready and capture URL
      const serverUrl = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 60000); // 60 second timeout

        this.container!.on('server-ready', (port, url) => {
          clearTimeout(timeout);
          resolve(url);
        });

        // Also listen for process exit as a failure condition
        serverProcess.exit.then(exitCode => {
          if (exitCode !== 0) {
            clearTimeout(timeout);
            reject(new Error(`Server process exited with code ${exitCode}`));
          }
        });
      });

      this.updateStatus({ 
        isStarting: false, 
        isReady: true, 
        serverUrl 
      });

      return serverUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start dev server';
      this.updateStatus({ 
        isStarting: false, 
        error: errorMessage 
      });
      throw error;
    }
  }

  /**
   * Run the complete setup: mount files, install dependencies, start server
   */
  async setupProject(files: ProjectFile[], startCommand: string = 'npm run dev'): Promise<string> {
    await this.init();
    await this.mountFiles(files);
    await this.installDependencies();
    const serverUrl = await this.startDevServer(startCommand);
    return serverUrl;
  }

  /**
   * Execute a command in the container
   */
  async executeCommand(command: string, args: string[] = []): Promise<number> {
    if (!this.container) {
      throw new Error('WebContainer not initialized');
    }

    const process = await this.container.spawn(command, args);

    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.emitTerminalOutput({ type: 'stdout', data });
        },
      })
    );

    return await process.exit;
  }

  /**
   * Clean up and tear down the container
   */
  async teardown(): Promise<void> {
    if (this.container) {
      await this.container.teardown();
      this.container = null;
      this.initPromise = null;
      this.updateStatus({
        isBooting: false,
        isInstalling: false,
        isStarting: false,
        isReady: false,
        serverUrl: undefined,
        error: undefined,
      });
    }
  }

  /**
   * Subscribe to terminal output
   */
  onTerminalOutput(listener: (output: TerminalOutput) => void): () => void {
    this.terminalOutputListeners.add(listener);
    return () => {
      this.terminalOutputListeners.delete(listener);
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: WebContainerStatus) => void): () => void {
    this.statusListeners.add(listener);
    // Immediately emit current status
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Get current status
   */
  getStatus(): WebContainerStatus {
    return { ...this.status };
  }

  /**
   * Helper to build nested file tree from flat file array
   */
  private buildFileTree(files: ProjectFile[]): any {
    const tree: any = {};

    for (const file of files) {
      const parts = file.path.split('/');
      let current = tree;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }

      const fileName = parts[parts.length - 1];
      current[fileName] = {
        file: {
          contents: file.content,
        },
      };
    }

    return tree;
  }

  /**
   * Emit terminal output to all listeners
   */
  private emitTerminalOutput(output: TerminalOutput): void {
    this.terminalOutputListeners.forEach(listener => listener(output));
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(updates: Partial<WebContainerStatus>): void {
    this.status = { ...this.status, ...updates };
    this.statusListeners.forEach(listener => listener(this.status));
  }
}
