import { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Icon } from "ol/style";

const PIN = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="36" viewBox="0 0 24 34"><path fill="#AD1F23" stroke="#ffffff" stroke-width="1.5" d="M12 1C6.5 1 2 5.4 2 10.9 2 18 12 33 12 33s10-15 10-22.1C22 5.4 17.5 1 12 1z"/><circle cx="12" cy="11" r="3.6" fill="#ffffff"/></svg>`
);
const markerStyle = new Style({ image: new Icon({ src: PIN, anchor: [0.5, 1] }) });

const TILES = {
  light: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  dark: "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
};

/**
 * OLMap — a small OpenLayers wrapper. The parent must give it a height.
 * props: center [lng,lat], zoom, markers [{id,lng,lat}], onClick(lng,lat),
 * onMarkerClick(id), interactive, variant 'light'|'dark', className, style.
 */
export default function OLMap({ center, zoom = 2, markers = [], onClick, onMarkerClick, interactive = true, variant = "light", className = "", style }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const sourceRef = useRef(null);
  const cbRef = useRef({ onClick, onMarkerClick });
  cbRef.current = { onClick, onMarkerClick };

  // init once
  useEffect(() => {
    const source = new VectorSource();
    sourceRef.current = source;
    const map = new Map({
      target: elRef.current,
      layers: [
        new TileLayer({ source: new XYZ({ url: TILES[variant] || TILES.light, attributions: "© CARTO © OpenStreetMap", crossOrigin: "anonymous" }) }),
        new VectorLayer({ source, style: markerStyle }),
      ],
      view: new View({ center: fromLonLat(center && center[0] != null ? center : [0, 20]), zoom }),
      controls: [],
      ...(interactive ? {} : { interactions: [] }),
    });
    mapRef.current = map;
    setTimeout(() => map.updateSize(), 0);

    map.on("click", (e) => {
      const feat = map.forEachFeatureAtPixel(e.pixel, (f) => f);
      if (feat && cbRef.current.onMarkerClick) { cbRef.current.onMarkerClick(feat.get("id")); return; }
      if (cbRef.current.onClick) { const [lng, lat] = toLonLat(e.coordinate); cbRef.current.onClick(lng, lat); }
    });
    if (interactive) {
      map.on("pointermove", (e) => {
        const hit = map.hasFeatureAtPixel(e.pixel);
        map.getTargetElement().style.cursor = hit && cbRef.current.onMarkerClick ? "pointer" : "";
      });
    }
    return () => { map.setTarget(undefined); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // markers
  useEffect(() => {
    const source = sourceRef.current;
    if (!source) return;
    source.clear();
    (markers || []).forEach((m) => {
      if (m == null || m.lng == null || m.lat == null) return;
      const f = new Feature({ geometry: new Point(fromLonLat([m.lng, m.lat])) });
      f.set("id", m.id);
      source.addFeature(f);
    });
  }, [markers]);

  // recenter when center changes
  useEffect(() => {
    if (!mapRef.current || !center || center[0] == null) return;
    const view = mapRef.current.getView();
    view.animate({ center: fromLonLat(center), zoom: Math.max(view.getZoom() || zoom, zoom), duration: 450 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center && center[0], center && center[1]]);

  return <div ref={elRef} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}
