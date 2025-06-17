interface CompositionRequest {
  compositionId: string;
  props: {
    titleText: string;
    subtitleText: string;
  };
  settings?: {
    width?: number;
    height?: number;
    fps?: number;
    durationInFrames?: number;
  };
}

interface CompositionResponse {
  success: boolean;
  composition?: {
    id: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    props: {
      titleText: string;
      subtitleText: string;
    };
  };
  error?: string;
}

export async function handleCompositionLambda(request: CompositionRequest): Promise<CompositionResponse> {
  try {
    console.log('Composition Lambda started:', request);

    // Validate composition request
    if (!request.compositionId || !request.props.titleText) {
      throw new Error('Invalid composition request: missing required fields');
    }

    // Default settings
    const defaultSettings = {
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 150,
    };

    const settings = { ...defaultSettings, ...request.settings };

    // Create composition configuration
    const composition = {
      id: request.compositionId,
      ...settings,
      props: {
        titleText: request.props.titleText,
        subtitleText: request.props.subtitleText,
      }
    };

    console.log('Composition created successfully:', composition.id);

    return {
      success: true,
      composition
    };

  } catch (error) {
    console.error('Composition Lambda error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown composition error'
    };
  }
}

export type { CompositionRequest, CompositionResponse }; 