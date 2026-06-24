import { r as reactExports, R as React } from "./react.mjs";
import "./leaflet.mjs";
import "./react-dom.mjs";
function useAttribution(map, attribution) {
  const attributionRef = reactExports.useRef(attribution);
  reactExports.useEffect(function updateAttribution() {
    if (attribution !== attributionRef.current && map.attributionControl != null) {
      if (attributionRef.current != null) {
        map.attributionControl.removeAttribution(attributionRef.current);
      }
      if (attribution != null) {
        map.attributionControl.addAttribution(attribution);
      }
    }
    attributionRef.current = attribution;
  }, [
    map,
    attribution
  ]);
}
function updateCircle(layer, props, prevProps) {
  if (props.center !== prevProps.center) {
    layer.setLatLng(props.center);
  }
  if (props.radius != null && props.radius !== prevProps.radius) {
    layer.setRadius(props.radius);
  }
}
const CONTEXT_VERSION = 1;
function createLeafletContext(map) {
  return Object.freeze({
    __version: CONTEXT_VERSION,
    map
  });
}
function extendContext(source, extra) {
  return Object.freeze({
    ...source,
    ...extra
  });
}
const LeafletContext = reactExports.createContext(null);
function useLeafletContext() {
  const context = reactExports.use(LeafletContext);
  if (context == null) {
    throw new Error("No context provided: useLeafletContext() can only be used in a descendant of <MapContainer>");
  }
  return context;
}
function createContainerComponent(useElement) {
  function ContainerComponent(props, forwardedRef) {
    const { instance, context } = useElement(props).current;
    reactExports.useImperativeHandle(forwardedRef, () => instance);
    const { children } = props;
    return children == null ? null : /* @__PURE__ */ React.createElement(LeafletContext, {
      value: context
    }, children);
  }
  return /* @__PURE__ */ reactExports.forwardRef(ContainerComponent);
}
function createLeafComponent(useElement) {
  function LeafComponent(props, forwardedRef) {
    const { instance } = useElement(props).current;
    reactExports.useImperativeHandle(forwardedRef, () => instance);
    return null;
  }
  return /* @__PURE__ */ reactExports.forwardRef(LeafComponent);
}
function useEventHandlers(element, eventHandlers) {
  const eventHandlersRef = reactExports.useRef(void 0);
  reactExports.useEffect(function addEventHandlers() {
    if (eventHandlers != null) {
      element.instance.on(eventHandlers);
    }
    eventHandlersRef.current = eventHandlers;
    return function removeEventHandlers() {
      if (eventHandlersRef.current != null) {
        element.instance.off(eventHandlersRef.current);
      }
      eventHandlersRef.current = null;
    };
  }, [
    element,
    eventHandlers
  ]);
}
function withPane(props, context) {
  const pane = props.pane ?? context.pane;
  return pane ? {
    ...props,
    pane
  } : props;
}
function createElementObject(instance, context, container) {
  return Object.freeze({
    instance,
    context,
    container
  });
}
function createElementHook(createElement, updateElement) {
  if (updateElement == null) {
    return function useImmutableLeafletElement(props, context) {
      const elementRef = reactExports.useRef(void 0);
      if (!elementRef.current) elementRef.current = createElement(props, context);
      return elementRef;
    };
  }
  return function useMutableLeafletElement(props, context) {
    const elementRef = reactExports.useRef(void 0);
    if (!elementRef.current) elementRef.current = createElement(props, context);
    const propsRef = reactExports.useRef(props);
    const { instance } = elementRef.current;
    reactExports.useEffect(function updateElementProps() {
      if (propsRef.current !== props) {
        updateElement(instance, props, propsRef.current);
        propsRef.current = props;
      }
    }, [
      instance,
      props,
      updateElement
    ]);
    return elementRef;
  };
}
function useLayerLifecycle(element, context) {
  reactExports.useEffect(function addLayer() {
    const container = context.layerContainer ?? context.map;
    container.addLayer(element.instance);
    return function removeLayer() {
      context.layerContainer?.removeLayer(element.instance);
      context.map.removeLayer(element.instance);
    };
  }, [
    context,
    element
  ]);
}
function createLayerHook(useElement) {
  return function useLayer(props) {
    const context = useLeafletContext();
    const elementRef = useElement(withPane(props, context), context);
    useAttribution(context.map, props.attribution);
    useEventHandlers(elementRef.current, props.eventHandlers);
    useLayerLifecycle(elementRef.current, context);
    return elementRef;
  };
}
function usePathOptions(element, props) {
  const optionsRef = reactExports.useRef(void 0);
  reactExports.useEffect(function updatePathOptions() {
    if (props.pathOptions !== optionsRef.current) {
      const options = props.pathOptions ?? {};
      element.instance.setStyle(options);
      optionsRef.current = options;
    }
  }, [
    element,
    props
  ]);
}
function createPathHook(useElement) {
  return function usePath(props) {
    const context = useLeafletContext();
    const elementRef = useElement(withPane(props, context), context);
    useEventHandlers(elementRef.current, props.eventHandlers);
    useLayerLifecycle(elementRef.current, context);
    usePathOptions(elementRef.current, props);
    return elementRef;
  };
}
function createLayerComponent(createElement, updateElement) {
  const useElement = createElementHook(createElement, updateElement);
  const useLayer = createLayerHook(useElement);
  return createContainerComponent(useLayer);
}
function createPathComponent(createElement, updateElement) {
  const useElement = createElementHook(createElement, updateElement);
  const usePath = createPathHook(useElement);
  return createContainerComponent(usePath);
}
function createTileLayerComponent(createElement, updateElement) {
  const useElement = createElementHook(createElement, updateElement);
  const useLayer = createLayerHook(useElement);
  return createLeafComponent(useLayer);
}
function updateGridLayer(layer, props, prevProps) {
  const { opacity, zIndex } = props;
  if (opacity != null && opacity !== prevProps.opacity) {
    layer.setOpacity(opacity);
  }
  if (zIndex != null && zIndex !== prevProps.zIndex) {
    layer.setZIndex(zIndex);
  }
}
export {
  LeafletContext as L,
  createElementObject as a,
  createLeafletContext as b,
  createPathComponent as c,
  createLayerComponent as d,
  extendContext as e,
  createTileLayerComponent as f,
  updateGridLayer as g,
  updateCircle as u,
  withPane as w
};
