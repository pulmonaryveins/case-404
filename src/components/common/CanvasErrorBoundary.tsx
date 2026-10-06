import { Component, type ReactNode } from "react";
import { WebGLFallbackNotice } from "./WebGLFallbackNotice";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Prevents a WebGL/Canvas initialization failure from producing a
 * permanent black screen. Essential portfolio content must remain
 * reachable even when the 3D experience cannot run (see
 * ARCHITECTURE.md "WebGL Fallback Strategy").
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <WebGLFallbackNotice />;
    }
    return this.props.children;
  }
}
