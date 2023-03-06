

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

loadData();