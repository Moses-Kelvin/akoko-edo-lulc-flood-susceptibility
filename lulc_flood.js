 
Map.centerObject(roi, 10);
Map.addLayer(roi, {}, 'Akoko Edo Boundary');

// Load Sentinel-2 Surface Reflectance
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(roi)
  .filterDate('2024-01-01', '2025-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5));

// Cloud masking function
function maskS2Clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask)
              .divide(10000)
              .copyProperties(image, ["system:time_start"]);
}

var s2Masked = s2.map(maskS2Clouds);

var composite = s2Masked.median().clip(roi);

Map.addLayer(composite, 
  {bands: ['B4','B3','B2'], min:0, max:0.3}, 
  'True Color Composite');

// Load SRTM DEM
var dem = ee.Image("USGS/SRTMGL1_003").clip(roi);
// Map.addLayer(dem, {min:100, max:600}, 'Elevation');

var slope = ee.Terrain.slope(dem);
// Map.addLayer(slope, {min:0, max:40}, 'Slope');

var ndvi = composite.normalizedDifference(['B8','B4'])
  .rename('NDVI');

var evi = composite.expression(
  '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
  {
    'NIR': composite.select('B8'),
    'RED': composite.select('B4'),
    'BLUE': composite.select('B2')
  }).rename('EVI');

var ndbi = composite.normalizedDifference(['B11','B8'])
  .rename('NDBI');

var mndwi = composite.normalizedDifference(['B3','B11'])
  .rename('MNDWI');

var bsi = composite.expression(
  '((SWIR + RED) - (NIR + BLUE)) / ((SWIR + RED) + (NIR + BLUE))',
  {
    'SWIR': composite.select('B11'),
    'RED': composite.select('B4'),
    'NIR': composite.select('B8'),
    'BLUE': composite.select('B2')
  }).rename('BSI');


var featureStack = composite
.select(['B2','B3','B4','B8','B11','B12','B5'])
  .addBands(ndvi)
  .addBands(evi)
  .addBands(ndbi)
  .addBands(mndwi)
  .addBands(bsi);

var training = forest
  .merge(agriculture)
  .merge(builtup)
  .merge(water)
  .merge(barren);

var trainingData = featureStack.sampleRegions({
  collection: training,
  properties: ['lulc'],
  scale: 10
});

print(trainingData.aggregate_histogram('lulc'));

var classifier = ee.Classifier.smileCart().train({
  features: trainingData,
  classProperty: 'lulc',
  inputProperties: featureStack.bandNames()
});

var classified = featureStack.classify(classifier);

var palette = [
  'darkgreen', // Forest
  '7FFF00', // Agriculture
  'red', // Built-up
  'blue', // Water
  'yellow'  // Barren
];

Map.addLayer(classified, {min:0, max:4, palette: palette}, 'LULC Map');

Export.image.toDrive({
  image: classified,
  description: 'Akoko_Edo_LULC_2024',
  scale: 10,
  region: roi,
  maxPixels: 1e13
});

var withRandom = trainingData.randomColumn('random');

var split = 0.7;
var trainSet = withRandom.filter(ee.Filter.lt('random', split));
var testSet = withRandom.filter(ee.Filter.gte('random', split));

var classifier70 = ee.Classifier.smileCart().train({
  features: trainSet,
  classProperty: 'lulc',
  inputProperties: featureStack.bandNames()
});

var validation = forest_val
  .merge(agriculture_val)
  .merge(builtup_val)
  .merge(water_val)
  .merge(barren_val);
  
var validationData = featureStack.sampleRegions({
  collection: validation,
  properties: ['lulc'],
  scale: 10
});

print(validationData.aggregate_histogram('lulc'));


var validated = validationData.classify(classifier);

var confusionMatrix = validated.errorMatrix('lulc', 'classification');

print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa:', confusionMatrix.kappa());
print('Producer Accuracy:', confusionMatrix.producersAccuracy());
print('User Accuracy:', confusionMatrix.consumersAccuracy());

// Flood modelling 
var demFilled = dem.focal_mean(1);
var slopeRad = slope.multiply(Math.PI).divide(180);
var flowAccum = dem
  .reduceNeighborhood({
    reducer: ee.Reducer.sum(),
    kernel: ee.Kernel.circle(5)
  });

var tanSlope = slopeRad.tan();

// Avoid division by zero
var twi = flowAccum
  .divide(tanSlope.add(0.001))
  .log()
  .rename('TWI');

Map.addLayer(twi, {min:5, max:15, palette:['yellow','orange','red','darkred']}, 'TWI');

var lcReclass = classified.remap(
  [0,1,2,3,4],
  [1,3,5,5,4]
).rename('LC_score');

var slopeScore = slope.expression(
  "(b <= 5) ? 5" +
  ": (b <= 10) ? 4" +
  ": (b <= 20) ? 3" +
  ": (b <= 35) ? 2" +
  ": 1", {
    'b': slope
}).rename('Slope_score');

print(slope.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13
}));

var elevScore = dem.expression(
  "(b <= 227) ? 5" +
  ": (b <= 349) ? 4" +
  ": (b <= 471) ? 3" +
  ": (b <= 593) ? 2" +
  ": 1", {
    'b': dem
}).rename('Elev_score');

print(dem.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13
}));


var twiScore = twi.expression(
  "(b <= 6.64) ? 1" +
  ": (b <= 8.31) ? 2" +
  ": (b <= 9.98) ? 3" +
  ": (b <= 11.65) ? 4" +
  ": 5", {
    'b': twi
}).rename('TWI_score');

print(twi.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13
}));


var fsi = lcReclass.multiply(0.35)
  .add(slopeScore.multiply(0.25))
  .add(twiScore.multiply(0.25))
  .add(elevScore.multiply(0.15))
  .rename('FSI');
 
print(fsi.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13
}));

Map.addLayer(fsi, {
  min:1,
  max:5,
  palette:['green','yellow','orange','red','darkred']
}, 'Flood Susceptibility Index');

var fsiClass = fsi.expression(
  "(b <= 2) ? 1" +
  ": (b <= 2.5) ? 2" +
  ": (b <= 3) ? 3" +
  ": (b <= 3.5) ? 4" +
  ": 5", {
    'b': fsi
}).rename('FSI_class');

Map.addLayer(fsiClass.clip(roi), {
  min:1,
  max:5,
  palette:['green','yellow','orange','red','darkred']
}, 'Flood Susceptibility Classes');


// Calculate area of each LULC class (in hectares)
var areaImage = ee.Image.pixelArea().divide(10000);

var lulcArea = areaImage.addBands(classified)
  .reduceRegion({
    reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class'
    }),
    geometry: roi,
    scale: 10,
    maxPixels: 1e13
  });

print('LULC Area Statistics (ha):', lulcArea);

var fsiArea = areaImage.addBands(fsiClass)
  .reduceRegion({
    reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class'
    }),
    geometry: roi,
    scale: 30,
    maxPixels: 1e13
  });

print('Flood Susceptibility Area (ha):', fsiArea);

// sensitivity test
// =============================
// Sensitivity Analysis Version
// =============================

// Recalculate FSI with adjusted weights
var fsi_sens = lcReclass.multiply(0.30)
  .add(slopeScore.multiply(0.30))
  .add(twiScore.multiply(0.25))
  .add(elevScore.multiply(0.15))
  .rename('FSI_sensitivity');

// Check min and max
print('FSI Sensitivity Min/Max:', fsi_sens.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13
}));

// Reclassify into 5 classes (same thresholds)
var fsiClass_sens = fsi_sens.expression(
  "(b <= 2) ? 1" +
  ": (b <= 2.5) ? 2" +
  ": (b <= 3) ? 3" +
  ": (b <= 3.5) ? 4" +
  ": 5", {
    'b': fsi_sens
}).rename('FSI_class_sensitivity');

// Add to map
Map.addLayer(fsiClass_sens.clip(roi), {
  min: 1,
  max: 5,
  palette: ['green','yellow','orange','red','darkred']
}, 'FSI Sensitivity Classes');

// Calculate area statistics
var areaImage = ee.Image.pixelArea().divide(10000);

var fsiSensArea = areaImage.addBands(fsiClass_sens)
  .reduceRegion({
    reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class'
    }),
    geometry: roi,
    scale: 30,
    maxPixels: 1e13
  });

print('Flood Susceptibility Area (Sensitivity Test) (ha):', fsiSensArea);

Export.image.toDrive({
  image: classified.clip(roi),
  description: 'Akoko_Edo_LULC_2024_UTM',
  scale: 10,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: fsiClass.clip(roi),
  description: 'Akoko_Edo_FSI_Classes_UTM',
  scale: 30,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: fsi.clip(roi),
  description: 'Akoko_Edo_FSI_Continuous_UTM',
  scale: 30,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: twi.clip(roi),
  description: 'Akoko_Edo_TWI_UTM',
  scale: 30,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: slope.clip(roi),
  description: 'Akoko_Edo_Slope_UTM',
  scale: 30,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: ndvi.clip(roi),
  description: 'Akoko_Edo_NDVI_UTM',
  scale: 10,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: ndbi.clip(roi),
  description: 'Akoko_Edo_NDBI_UTM',
  scale: 10,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: bsi.clip(roi),
  description: 'Akoko_Edo_BSI_UTM',
  scale: 10,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: composite.clip(roi),
  description: 'Akoko_Edo_Composite_UTM',
  scale: 10,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: dem.clip(roi),
  description: 'Akoko_Edo_Elevation_UTM',
  scale: 30,
  region: roi,
  crs: 'EPSG:32631',
  maxPixels: 1e13
});

 