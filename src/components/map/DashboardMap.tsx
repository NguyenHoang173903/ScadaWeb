import { useEffect, useRef, useState } from 'react'
import L, { type PathOptions } from 'leaflet'
import 'leaflet.markercluster'
import type { Feature } from 'geojson'
import {
  buildMapStations,
  STATION_TYPE_COLOR,
  type MapStation,
} from './extractStations'
import type { MapOverlayLayer } from './layerTypes'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import styles from './DashboardMap.module.css'

const HANOI_CENTER: L.LatLngTuple = [21.0285, 105.8542]
const CLUSTER_DISABLE_ZOOM = 17

/** Northern Vietnam — prevents zooming/panning out of the region. */
const NORTH_VIETNAM_BOUNDS = L.latLngBounds(
  [19.8, 102.1], // SW
  [23.55, 108.1], // NE
)
const MAP_MIN_ZOOM = 7
const MAP_MAX_ZOOM = 18

const SATELLITE_TILE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const asColor = (value: unknown): string | undefined =>
  typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
    ? value.length === 9
      ? `#${value.slice(1, 7)}`
      : value
    : undefined

/**
 * Prefer per-feature KML colors (`stroke` / `fill`) so lines stay multi-colored.
 * Layer panel opacity + weight still apply globally.
 */
const styleFromFeature =
  (layer: Pick<MapOverlayLayer, 'color' | 'opacity' | 'weight'>) =>
  (feature?: Feature): PathOptions => {
    const props = (feature?.properties ?? null) as Record<string, unknown> | null
    const stroke = asColor(props?.stroke) ?? layer.color
    const fill = asColor(props?.fill) ?? stroke

    return {
      color: stroke,
      weight: layer.weight,
      opacity: layer.opacity,
      fillColor: fill,
      fillOpacity: layer.opacity * 0.12,
    }
  }

function createStationIcon(color: string) {
  return L.divIcon({
    className: styles.stationMarker,
    html: `<span class="${styles.stationDot}" style="background:${color};box-shadow:0 0 0 2px rgba(12,255,12,0.25)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    tooltipAnchor: [0, -10],
  })
}

function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount()
  const sizeClass =
    count < 10 ? styles.clusterSmall : count < 50 ? styles.clusterMedium : styles.clusterLarge

  return L.divIcon({
    html: `<div class="${styles.clusterInner}"><span>${count}</span></div>`,
    className: `${styles.clusterIcon} ${sizeClass}`,
    iconSize: L.point(44, 44),
  })
}

type Props = {
  layers: MapOverlayLayer[]
  onSelectStation?: (station: MapStation) => void
}

export function DashboardMap({ layers, onSelectStation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<Map<string, L.GeoJSON>>(new Map())
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const fittedRef = useRef(false)
  const overviewBoundsRef = useRef<L.LatLngBounds | null>(null)
  const onSelectRef = useRef(onSelectStation)
  const [mapReady, setMapReady] = useState(0)

  useEffect(() => {
    onSelectRef.current = onSelectStation
  }, [onSelectStation])

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      center: HANOI_CENTER,
      zoom: 10,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxBounds: NORTH_VIETNAM_BOUNDS,
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      touchZoom: true,
      keyboard: true,
    })

    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    L.tileLayer(SATELLITE_TILE, {
      attribution: 'Tiles &copy; Esri',
      maxZoom: MAP_MAX_ZOOM,
    }).addTo(map)

    const clusters = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: CLUSTER_DISABLE_ZOOM,
      maxClusterRadius: 55,
      iconCreateFunction: createClusterIcon,
    })

    clusters.addTo(map)
    clusterRef.current = clusters

    mapRef.current = map
    setMapReady((value) => value + 1)

    requestAnimationFrame(() => {
      map.invalidateSize()
    })

    return () => {
      overlayRef.current.forEach((layer) => layer.remove())
      overlayRef.current.clear()
      clusters.clearLayers()
      map.removeLayer(clusters)
      clusterRef.current = null
      map.remove()
      mapRef.current = null
      fittedRef.current = false
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || mapReady === 0) return

    const activeIds = new Set(layers.map((layer) => layer.id))

    overlayRef.current.forEach((instance, id) => {
      if (!activeIds.has(id)) {
        instance.remove()
        overlayRef.current.delete(id)
        fittedRef.current = false
      }
    })

    layers.forEach((layerConfig) => {
      let instance = overlayRef.current.get(layerConfig.id)
      const featureStyle = styleFromFeature(layerConfig)

      if (!instance) {
        instance = L.geoJSON(layerConfig.geojson, {
          style: featureStyle,
          // Points are rendered separately as clustered station markers.
          filter: (feature) => feature.geometry?.type !== 'Point',
          onEachFeature: (feature, layer) => {
            const name = (feature.properties as { name?: string } | null)?.name
            if (name) {
              layer.bindTooltip(name, { sticky: true, direction: 'top', opacity: 0.95 })
            }
          },
        })
        overlayRef.current.set(layerConfig.id, instance)
        fittedRef.current = false
      } else {
        instance.setStyle(featureStyle)
      }

      if (layerConfig.visible && !map.hasLayer(instance)) {
        instance.addTo(map)
      } else if (!layerConfig.visible && map.hasLayer(instance)) {
        map.removeLayer(instance)
      }
    })

    if (!fittedRef.current && layers.length > 0) {
      const first = overlayRef.current.get(layers[0].id)
      const bounds = first?.getBounds()
      if (bounds?.isValid()) {
        overviewBoundsRef.current = bounds
        map.fitBounds(bounds, {
          padding: [48, 48],
          maxZoom: 12,
          animate: false,
        })
        fittedRef.current = true
      }
    }
  }, [layers, mapReady])

  useEffect(() => {
    const clusters = clusterRef.current
    if (!clusters || mapReady === 0) return

    clusters.clearLayers()
    const stations = buildMapStations(layers)

    stations.forEach((station) => {
      const color = station.color ?? STATION_TYPE_COLOR[station.type]
      const marker = L.marker([station.lat, station.lng], {
        icon: createStationIcon(color),
        riseOnHover: true,
        interactive: true,
        keyboard: true,
      })

      marker.bindTooltip(station.name, {
        direction: 'top',
        offset: [0, -8],
        opacity: 0.95,
      })

      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event)
        onSelectRef.current?.(station)
      })

      clusters.addLayer(marker)
    })
  }, [layers, mapReady])

  return <div ref={containerRef} className={styles.map} aria-label="Bản đồ giám sát" />
}
