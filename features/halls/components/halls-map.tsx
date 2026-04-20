"use client";

import { useEffect, useMemo, useRef } from "react";
import { layers, namedFlavor } from "@protomaps/basemaps";
import maplibregl, { LngLatBounds } from "maplibre-gl";
import { Protocol } from "pmtiles";
import type { HallMapPoint } from "@/features/halls/schemas/halls-search.schema";

const MAP_SOURCE_ID = "halls-source";
const MAP_CLUSTER_LAYER_ID = "halls-cluster-layer";
const MAP_CLUSTER_COUNT_LAYER_ID = "halls-cluster-count-layer";
const MAP_POINT_LAYER_ID = "halls-point-layer";
const MAP_HOVER_LAYER_ID = "halls-hover-layer";
const MAP_SELECTED_LAYER_ID = "halls-selected-layer";

const DEFAULT_PMTILES_URL = "https://demo-bucket.protomaps.com/v4.pmtiles";
const DEFAULT_ATTRIBUTION =
  '<a href="https://github.com/protomaps/basemaps">Protomaps</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

let protocolRegistered = false;

function ensurePmtilesProtocolRegistered() {
  if (protocolRegistered) {
    return;
  }

  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  protocolRegistered = true;
}

function createBasemapStyle() {
  const pmtilesUrl = process.env.NEXT_PUBLIC_MAPLIBRE_PMTILES_URL || DEFAULT_PMTILES_URL;

  return {
    version: 8 as const,
    glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
    sources: {
      protomaps: {
        type: "vector" as const,
        url: `pmtiles://${pmtilesUrl}`,
        attribution: DEFAULT_ATTRIBUTION,
      },
    },
    layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
  };
}

type HallsMapProps = {
  points: HallMapPoint[];
  hoveredHallId: string | null;
  selectedHallId: string | null;
  onSelectHall: (hallId: string) => void;
  className?: string;
};

export function HallsMap({
  points,
  hoveredHallId,
  selectedHallId,
  onSelectHall,
  className,
}: HallsMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styleUrl = process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL?.trim();

  const geojsonData = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: points.map((point) => ({
        type: "Feature" as const,
        id: point.id,
        properties: {
          id: point.id,
          name: point.name,
          city: point.city,
          state: point.state,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude] as [number, number],
        },
      })),
    }),
    [points],
  );

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    ensurePmtilesProtocolRegistered();
    const map = new maplibregl.Map({
      container: mapElementRef.current,
      style: styleUrl && styleUrl.length > 0 ? styleUrl : createBasemapStyle(),
      center: [101.6869, 3.139],
      zoom: 9,
      minZoom: 4,
      maxZoom: 18,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource(MAP_SOURCE_ID, {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 14,
      });

      map.addLayer({
        id: MAP_CLUSTER_LAYER_ID,
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#111827",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            20,
            22,
            60,
            28,
          ],
          "circle-opacity": 0.9,
        },
      });

      map.addLayer({
        id: MAP_CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: MAP_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: MAP_POINT_LAYER_ID,
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#0f766e",
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: MAP_HOVER_LAYER_ID,
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["==", ["get", "id"], ""],
        paint: {
          "circle-color": "#0ea5e9",
          "circle-radius": 10,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: MAP_SELECTED_LAYER_ID,
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["==", ["get", "id"], ""],
        paint: {
          "circle-color": "#7c3aed",
          "circle-radius": 12,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.on("click", MAP_CLUSTER_LAYER_ID, (event) => {
        const clusterFeature = event.features?.[0];
        if (!clusterFeature) {
          return;
        }

        const clusterId = clusterFeature.properties?.cluster_id;
        const source = map.getSource(MAP_SOURCE_ID) as maplibregl.GeoJSONSource & {
          getClusterExpansionZoom?: (
            id: number,
            callback: (error: Error | null, zoom: number) => void,
          ) => void;
        };

        if (!source.getClusterExpansionZoom || typeof clusterId !== "number") {
          return;
        }

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) {
            return;
          }

          const coordinates = clusterFeature.geometry?.type === "Point"
            ? clusterFeature.geometry.coordinates
            : null;
          if (!coordinates) {
            return;
          }

          map.easeTo({
            center: coordinates as [number, number],
            zoom,
            duration: 450,
          });
        });
      });

      map.on("click", MAP_POINT_LAYER_ID, (event) => {
        const hallId = event.features?.[0]?.properties?.id;
        if (typeof hallId === "string" && hallId.length > 0) {
          onSelectHall(hallId);
        }
      });

      map.on("mouseenter", MAP_CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MAP_CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", MAP_POINT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MAP_POINT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geojsonData, onSelectHall, styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource(MAP_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(geojsonData);
  }, [geojsonData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) {
      return;
    }

    const bounds = points.reduce((currentBounds, point) => {
      currentBounds.extend([point.longitude, point.latitude]);
      return currentBounds;
    }, new LngLatBounds([points[0].longitude, points[0].latitude], [points[0].longitude, points[0].latitude]));

    map.fitBounds(bounds, {
      padding: 60,
      duration: 500,
      maxZoom: 13,
    });
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(MAP_HOVER_LAYER_ID)) {
      return;
    }

    map.setFilter(MAP_HOVER_LAYER_ID, ["==", ["get", "id"], hoveredHallId ?? ""]);
  }, [hoveredHallId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(MAP_SELECTED_LAYER_ID)) {
      return;
    }

    map.setFilter(MAP_SELECTED_LAYER_ID, ["==", ["get", "id"], selectedHallId ?? ""]);

    if (!selectedHallId) {
      return;
    }

    const selectedPoint = points.find((point) => point.id === selectedHallId);
    if (!selectedPoint) {
      return;
    }

    map.easeTo({
      center: [selectedPoint.longitude, selectedPoint.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 450,
    });
  }, [points, selectedHallId]);

  return (
    <div className={className}>
      <div ref={mapElementRef} className="h-full w-full" />
    </div>
  );
}
