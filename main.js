// Retrieve the view container
const viewerDiv = document.getElementById('viewerDiv');

// Define the view geographic extent
itowns.proj4.defs(
    'EPSG:2975',
    '+proj=utm +zone=40 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);
const viewExtent = new itowns.Extent(
    'EPSG:2975',
    300000.0, 400000.0,
    7630000.0, 7700000.0,
);

const ITOWNS_GPX_PARSER_OPTIONS = { in: { crs: 'EPSG:4326' }, out: { crs: 'EPSG:4326', mergeFeatures: true } };

// Define the camera initial placement
const placement = {
    coord: viewExtent.center(),
    tilt: 12,
    heading: 40,
    range: 16000,
};

// Create the planar view
const view = new itowns.PlanarView(viewerDiv, viewExtent, {
    placement: placement,
});

// Define the source of the ortho-images
const sourceOrtho = new itowns.WMSSource({
    url: "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/r/wms",
    name: "HR.ORTHOIMAGERY.ORTHOPHOTOS",
    format: "image/png",
    crs: 'EPSG:2975',
    extent: viewExtent,
});
// Create the ortho-images ColorLayer and add it to the view
const layerOrtho = new itowns.ColorLayer('Ortho', { source: sourceOrtho });
view.addLayer(layerOrtho);

// Define the source of the dem data
const sourceDEM = new itowns.WMSSource({
    url: "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/r/wms",
    name: "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES",
    format: "image/x-bil;bits=32",
    crs: 'EPSG:2975',
    extent: viewExtent,
});
// Create the dem ElevationLayer and add it to the view
const layerDEM = new itowns.ElevationLayer('DEM', { source: sourceDEM });
view.addLayer(layerDEM);


// update the waypoint
var distance, scale, point = new itowns.THREE.Vector3();
var size = new itowns.THREE.Vector2();
function updatePointScale(renderer, scene, camera) {
    point.copy(this.geometry.boundingSphere.center).applyMatrix4(this.matrixWorld);;
    distance = camera.position.distanceTo(point);
    renderer.getSize(size);
    scale = Math.max(2, Math.min(100, distance / size.y));
    this.scale.set(scale, scale, scale);
    this.updateMatrixWorld();
}

var waypointGeometry = new itowns.THREE.BoxGeometry(1, 1, 80);
var waypointMaterial = new itowns.THREE.MeshBasicMaterial({ color: 0xffffff });
// Listen for globe full initialisation event
view.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function () {
    console.info('Globe initialized');
    itowns.Fetcher.xml('./assets/diag.gpx')
        .then(gpx => itowns.GpxParser.parse(gpx, {
            in: {
                crs: 'EPSG:4326',
            },
            out: {
                crs: view.referenceCrs,
                structure: '3d',
                style: new itowns.Style({
                    stroke: {
                        color: 'red',
                        width: 2
                    },
                    point: {
                        color: 'white'
                    }
                })
            }
        }))
        .then(itowns.Feature2Mesh.convert())
        .then(function (mesh) {
            console.log(mesh);
            if (mesh) {
                mesh.updateMatrixWorld();
                mesh.traverse((m) => {
                    if (m.type == 'Line') {
                        var vertices = m.feature.vertices;
                        console.log(vertices);
                        for (var i = 0; i < vertices.length; i += 3) {
                            var waypoint = new itowns.THREE.Mesh(waypointGeometry, waypointMaterial);
                            waypoint.position.fromArray(vertices, i);
                            waypoint.lookAt(mesh.worldToLocal(new itowns.THREE.Vector3()));
                            waypoint.onBeforeRender = updatePointScale;
                            waypoint.updateMatrix();
                            mesh.add(waypoint);
                            waypoint.updateMatrixWorld();
                        }
                    }
                });
                view.scene.add(mesh);
                view.notifyChange();
            }
        });
});