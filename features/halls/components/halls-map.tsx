"use client";

import { useEffect, useMemo, useRef } from "react";
import { layers, namedFlavor } from "@protomaps/basemaps";
import maplibregl, { LngLatBounds } from "maplibre-gl";
import { Protocol } from "pmtiles";
import type { HallMapPoint } from "@/features/halls/schemas/halls-search.schema";

const MAP_SOURCE_ID = "halls-source";
const MAP_CLUSTER_LAYER_ID = "halls-cluster-layer";
const MAP_CLUSTER_COUNT_LAYER_ID = "halls-cluster-count-layer";
const MAP_PRICE_LAYER_ID = "halls-price-layer";
const MAP_PRICE_HOVER_LAYER_ID = "halls-price-hover-layer";
const MAP_PRICE_SELECTED_LAYER_ID = "halls-price-selected-layer";
const PRICE_PILL_DEFAULT_IMAGE = "price-pill-default";
const PRICE_PILL_HOVER_IMAGE = "price-pill-hover";
const PRICE_PILL_SELECTED_IMAGE = "price-pill-selected";

const DEFAULT_PMTILES_URL = "https://demo-bucket.protomaps.com/v4.pmtiles";
const DEFAULT_ATTRIBUTION =
  '<a href="https://github.com/protomaps/basemaps">Protomaps</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

let protocolRegistered = false;
let pmtilesProtocol: Protocol | null = null;

function ensurePmtilesProtocolRegistered() {
  if (protocolRegistered) {
    return;
  }

  pmtilesProtocol = new Protocol();
  maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile.bind(pmtilesProtocol));
  protocolRegistered = true;
}

function createPmtilesBasemapStyle() {
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

function createRasterFallbackStyle() {
  return {
    version: 8 as const,
    glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    sources: {
      carto: {
        type: "raster" as const,
        tiles: [
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        ],
        scheme: "xyz" as const,
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      osm: {
        type: "raster" as const,
        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "map-bg",
        type: "background" as const,
        paint: {
          "background-color": "#E5E7EB",
        },
      },
      {
        id: "carto-raster",
        type: "raster" as const,
        source: "carto",
        paint: {
          "raster-opacity": 1,
        },
      },
      {
        id: "osm-raster",
        type: "raster" as const,
        source: "osm",
        paint: {
          "raster-opacity": 0.0001,
        },
      },
    ],
  };
}

function formatPriceLabel(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function createPillPngDataUrl(fill: string, stroke: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 124;
  canvas.height = 52;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  const x = 8;
  const y = 8;
  const width = 108;
  const height = 36;
  const radius = 18;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.5;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.shadowColor = "rgba(0, 0, 0, 0)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

function loadImage(map: maplibregl.Map, id: string, imageUrl: string) {
  if (map.hasImage(id)) {
    return Promise.resolve();
  }

  return map.loadImage(imageUrl).then((response) => {
    map.addImage(id, response.data);
  });
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
  const onSelectHallRef = useRef(onSelectHall);
  const styleUrl = process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL?.trim();
  const usePmtiles =
    (process.env.NEXT_PUBLIC_MAPLIBRE_USE_PMTILES ?? "").trim().toLowerCase() === "true";

  useEffect(() => {
    onSelectHallRef.current = onSelectHall;
  }, [onSelectHall]);

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
          priceLabel: formatPriceLabel(point.basePriceMyr),
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

    if (usePmtiles && !styleUrl) {
      ensurePmtilesProtocolRegistered();
    }
    let hasActivatedFallback = false;

    const map = new maplibregl.Map({
      container: mapElementRef.current,
      style:
        styleUrl && styleUrl.length > 0
          ? styleUrl
          : usePmtiles
            ? createPmtilesBasemapStyle()
            : createRasterFallbackStyle(),
      center: [101.6869, 3.139],
      zoom: 9,
      minZoom: 4,
      maxZoom: 18,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("error", (event) => {
      if (styleUrl && styleUrl.length > 0) {
        return;
      }

      if (hasActivatedFallback) {
        return;
      }

      const message = event.error?.message?.toLowerCase() ?? "";
      const shouldFallback =
        message.includes("pmtiles") ||
        message.includes("protomaps") ||
        message.includes("sprite") ||
        message.includes("glyph") ||
        message.includes("failed to fetch") ||
        message.includes("networkerror");

      if (!shouldFallback) {
        return;
      }

      hasActivatedFallback = true;
      map.setStyle(createRasterFallbackStyle());
    });

    map.on("load", async () => {
      const defaultPillUrl = createPillPngDataUrl("#FFFFFF", "#D4D4D8");
      const hoverPillUrl = createPillPngDataUrl("#EEF6FF", "#60A5FA");
      const selectedPillUrl = createPillPngDataUrl("#111827", "#111827");

      try {
        if (defaultPillUrl && hoverPillUrl && selectedPillUrl) {
          await Promise.all([
            loadImage(map, PRICE_PILL_DEFAULT_IMAGE, defaultPillUrl),
            loadImage(map, PRICE_PILL_HOVER_IMAGE, hoverPillUrl),
            loadImage(map, PRICE_PILL_SELECTED_IMAGE, selectedPillUrl),
          ]);
        }
      } catch {
        // If custom marker images fail, map still renders and fallbacks can continue.
      }

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
        id: MAP_PRICE_LAYER_ID,
        type: "symbol",
        source: MAP_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": PRICE_PILL_DEFAULT_IMAGE,
          "icon-size": 1,
          "text-field": ["get", "priceLabel"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
          "text-anchor": "center",
          "text-allow-overlap": true,
          "icon-allow-overlap": true,
        },
        paint: {
          "text-color": "#111827",
        },
      });

      map.addLayer({
        id: MAP_PRICE_HOVER_LAYER_ID,
        type: "symbol",
        source: MAP_SOURCE_ID,
        filter: ["==", ["get", "id"], ""],
        layout: {
          "icon-image": PRICE_PILL_HOVER_IMAGE,
          "icon-size": 1.04,
          "text-field": ["get", "priceLabel"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
          "text-anchor": "center",
          "text-allow-overlap": true,
          "icon-allow-overlap": true,
        },
        paint: {
          "text-color": "#0f172a",
        },
      });

      map.addLayer({
        id: MAP_PRICE_SELECTED_LAYER_ID,
        type: "symbol",
        source: MAP_SOURCE_ID,
        filter: ["==", ["get", "id"], ""],
        layout: {
          "icon-image": PRICE_PILL_SELECTED_IMAGE,
          "icon-size": 1.08,
          "text-field": ["get", "priceLabel"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
          "text-anchor": "center",
          "text-allow-overlap": true,
          "icon-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
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

      const handlePointClick = (event: maplibregl.MapLayerMouseEvent) => {
        const hallId = event.features?.[0]?.properties?.id;
        if (typeof hallId === "string" && hallId.length > 0) {
          onSelectHallRef.current(hallId);
        }
      };

      map.on("click", MAP_PRICE_LAYER_ID, handlePointClick);
      map.on("click", MAP_PRICE_HOVER_LAYER_ID, handlePointClick);
      map.on("click", MAP_PRICE_SELECTED_LAYER_ID, handlePointClick);

      map.on("mouseenter", MAP_CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MAP_CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", MAP_PRICE_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MAP_PRICE_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", MAP_PRICE_HOVER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MAP_PRICE_HOVER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", MAP_PRICE_SELECTED_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MAP_PRICE_SELECTED_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geojsonData, styleUrl, usePmtiles]);

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
    if (!map || !map.getLayer(MAP_PRICE_HOVER_LAYER_ID)) {
      return;
    }

    map.setFilter(MAP_PRICE_HOVER_LAYER_ID, ["==", ["get", "id"], hoveredHallId ?? ""]);
  }, [hoveredHallId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(MAP_PRICE_SELECTED_LAYER_ID)) {
      return;
    }

    map.setFilter(MAP_PRICE_SELECTED_LAYER_ID, ["==", ["get", "id"], selectedHallId ?? ""]);

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
