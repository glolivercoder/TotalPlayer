import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    
    // Display a toast notification
    toast({
      title: 'Ocorreu um erro',
      description: error.message || 'Um erro inesperado ocorreu na aplicação',
      variant: 'destructive',
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
          <h2 className="text-lg font-semibold mb-2">Algo deu errado</h2>
          <p className="mb-4">{this.state.error?.message || 'Ocorreu um erro inesperado'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
