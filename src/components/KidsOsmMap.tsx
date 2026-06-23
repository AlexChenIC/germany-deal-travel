import { useEffect, useMemo, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { KidActivity, KidActivityCategory } from "../types";

export type MappedKidActivity = KidActivity & { lat: number; lng: number };

const berlinCenter: L.LatLngExpression = [52.52, 13.405];

const markerColors: Record<KidActivityCategory, string> = {
  cafe: "#a85d2b",
  music: "#6e65b5",
  "open-play": "#16826f",
  swim: "#2e82a8",
  museum: "#8a6b18",
  theatre: "#b54b5f",
  calendar: "#59636d",
};

export function KidsOsmMap({
  items,
  selectedActivity,
  onSelectActivity,
}: {
  items: MappedKidActivity[];
  selectedActivity?: MappedKidActivity;
  onSelectActivity: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const sortedItems = useMemo(
    () => items.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)),
    [items],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: berlinCenter,
      zoom: 11,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const bounds = L.latLngBounds([]);
    sortedItems.forEach((item, index) => {
      const isSelected = item.id === selectedActivity?.id;
      const color = markerColors[item.category];
      const marker = L.circleMarker([item.lat, item.lng], {
        radius: isSelected ? 11 : 8,
        color: isSelected ? "#1c2526" : "#fffdfa",
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: 0.95,
      });
      marker
        .bindTooltip(`${index + 1}. ${item.nameZh}`, {
          direction: "top",
          offset: [0, -8],
          opacity: 0.95,
        })
        .on("click", () => onSelectActivity(item.id))
        .addTo(layer);
      bounds.extend([item.lat, item.lng]);
    });

    if (selectedActivity) {
      map.flyTo([selectedActivity.lat, selectedActivity.lng], Math.max(map.getZoom(), 13), {
        animate: true,
        duration: 0.35,
      });
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
    } else {
      map.setView(berlinCenter, 11);
    }
  }, [onSelectActivity, selectedActivity, sortedItems]);

  return (
    <div className="osm-map-shell">
      <div className="osm-map" ref={containerRef} />
      <div className="map-selector" aria-label="OpenStreetMap location selector">
        {sortedItems.map((item, index) => (
          <button
            className={
              selectedActivity?.id === item.id
                ? "map-location-chip is-active"
                : "map-location-chip"
            }
            key={item.id}
            onClick={() => onSelectActivity(item.id)}
            type="button"
          >
            <span>{index + 1}</span>
            {item.nameZh}
          </button>
        ))}
      </div>
    </div>
  );
}
