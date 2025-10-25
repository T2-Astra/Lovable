import { useState, useCallback, useRef, useEffect } from 'react';
import type { GenerationResponse, StreamEvent } from '@shared/schema';

interface StreamingState {
  status: string;
  fileName?: string;
  progress: number;
  isStreaming: boolean;
  error: string | null;
  project: GenerationResponse | null;
}

export function useStreamingGenerate() {
  const [state, setState] = useState<StreamingState>({
    status: '',
    fileName: undefined,
    progress: 0,
    isStreaming: false,
    error: null,
    project: null,
  });
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  const generate = useCallback(async (prompt: string, template?: string): Promise<GenerationResponse> => {
    return new Promise((resolve, reject) => {
      cleanup();
      
      let isCompleted = false;
      
      setState({
        status: 'Initializing...',
        fileName: undefined,
        progress: 0,
        isStreaming: true,
        error: null,
        project: null,
      });
      
      const params = new URLSearchParams({ prompt });
      if (template) {
        params.append('template', template);
      }
      
      const eventSource = new EventSource(`/api/generate/stream?${params.toString()}`);
      eventSourceRef.current = eventSource;
      
      eventSource.addEventListener('status', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            status: data.message,
            progress: Math.min(prev.progress + 10, 90),
          }));
        } catch (error) {
          console.error('Failed to parse status event:', error);
        }
      });
      
      eventSource.addEventListener('file', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            fileName: data.fileName,
            progress: data.progress,
          }));
        } catch (error) {
          console.error('Failed to parse file event:', error);
        }
      });
      
      eventSource.addEventListener('complete', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          isCompleted = true;
          setState(prev => ({
            ...prev,
            status: 'Complete',
            progress: 100,
            isStreaming: false,
            project: data.project,
          }));
          cleanup();
          resolve(data.project);
        } catch (error) {
          console.error('Failed to parse complete event:', error);
          const err = error instanceof Error ? error : new Error('Failed to parse completion data');
          setState(prev => ({
            ...prev,
            isStreaming: false,
            error: err.message,
          }));
          cleanup();
          reject(err);
        }
      });
      
      eventSource.addEventListener('error', (event: MessageEvent) => {
        if (isCompleted) return;
        
        try {
          const data = JSON.parse(event.data);
          const errorMessage = data.error || 'Unknown error occurred';
          setState(prev => ({
            ...prev,
            isStreaming: false,
            error: errorMessage,
          }));
          cleanup();
          reject(new Error(errorMessage));
        } catch (error) {
          const errorMessage = 'Stream connection error';
          setState(prev => ({
            ...prev,
            isStreaming: false,
            error: errorMessage,
          }));
          cleanup();
          reject(new Error(errorMessage));
        }
      });
      
      eventSource.onerror = () => {
        if (isCompleted) return;
        
        const errorMessage = 'Connection to server lost';
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }));
        cleanup();
        reject(new Error(errorMessage));
      };
    });
  }, [cleanup]);
  
  const cancel = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      isStreaming: false,
      status: 'Cancelled',
    }));
  }, [cleanup]);
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  return {
    generate,
    cancel,
    status: state.status,
    fileName: state.fileName,
    progress: state.progress,
    isStreaming: state.isStreaming,
    error: state.error,
    project: state.project,
  };
}
