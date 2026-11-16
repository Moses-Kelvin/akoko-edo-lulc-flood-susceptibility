
# Land Use/Land Cover Mapping and Flood Susceptibility Assessment in Akoko Edo, Nigeria

## Project Overview

This project presents a Google Earth Engine (GEE)-based assessment of land use/land cover (LULC) and flood susceptibility in Akoko Edo Local Government Area, Edo State, Nigeria.

The study combines Sentinel-2 multispectral imagery, spectral indices, digital elevation data and terrain analysis to examine land cover characteristics and their relationship with potential flood susceptibility.

Land use/land cover classification was performed using the Classification and Regression Trees (CART) algorithm. The resulting classification was subsequently integrated with elevation, slope and the Topographic Wetness Index (TWI) through a weighted-overlay approach to generate a Flood Susceptibility Index (FSI).

A sensitivity analysis was also conducted using an alternative weighting scheme to examine changes in the spatial distribution of susceptibility classes.

## Study Area

The study covers Akoko Edo Local Government Area in Edo State, southern Nigeria. The analysis focuses on the spatial distribution of land cover classes, terrain characteristics and areas with varying levels of potential flood susceptibility.

## Data Sources

The analysis incorporated the following satellite and geospatial datasets:

| Dataset | Source | Application |
|---|---|---|
| Sentinel-2 Surface Reflectance Harmonized | Copernicus | Land cover classification and spectral index generation |
| SRTM Digital Elevation Model | USGS | Elevation and slope derivation |
| Google Earth Engine | Google | Cloud-based geospatial processing and analysis |

### Satellite Image Acquisition

Sentinel-2 Surface Reflectance Harmonized imagery was obtained from the COPERNICUS/S2_SR_HARMONIZED collection.

The image collection was filtered using the following parameters:

- **Acquisition period:** 1 January 2024 – 31 December 2025.
- **Cloud cover threshold:** Less than 5%.
- **Cloud masking:** QA60 cloud and cirrus bit masking.
- **Composite generation:** Median compositing.
- **Spatial resolution:** 10 m for the principal Sentinel-2 bands used in the analysis.

A true-colour composite was generated using the red, green and blue bands.

## Methodology

The workflow consisted of satellite image preprocessing, spectral index generation, land cover classification, terrain analysis, flood susceptibility modelling and sensitivity analysis.

### 1. Sentinel-2 Image Preprocessing

Sentinel-2 imagery was filtered by the study area, acquisition period and cloud-cover percentage.

Cloud and cirrus contamination were reduced using the QA60 quality assessment band. The resulting image collection was composited using the median reducer and clipped to the study area boundary.

The composite provided the spectral information required for land cover classification and index calculation.

### 2. Spectral Indices

Five spectral indices were generated to support the analysis of vegetation, built-up surfaces, water and exposed soil characteristics.

**Normalized Difference Vegetation Index (NDVI)**

Used to examine vegetation distribution and condition.

\[
NDVI = \frac{NIR-RED}{NIR+RED}
\]

**Enhanced Vegetation Index (EVI)**

Used to improve vegetation assessment through additional atmospheric and background correction terms.

\[
EVI = 2.5\left(
\frac{NIR-RED}{NIR+6RED-7.5BLUE+1}
\right)
\]

**Normalized Difference Built-up Index (NDBI)**

Used to identify built-up surfaces.

\[
NDBI = \frac{SWIR-NIR}{SWIR+NIR}
\]

**Modified Normalized Difference Water Index (MNDWI)**

Used to enhance the identification of surface water features.

\[
MNDWI = \frac{GREEN-SWIR}{GREEN+SWIR}
\]

**Bare Soil Index (BSI)**

Used to distinguish exposed soil and sparsely vegetated surfaces.

\[
BSI =
\frac{(SWIR+RED)-(NIR+BLUE)}
{(SWIR+RED)+(NIR+BLUE)}
\]

These indices were combined with selected Sentinel-2 spectral bands to construct the classification feature stack.

### 3. Land Use/Land Cover Classification

Five land cover categories were considered:

| Class Code | Land Cover Category |
|---|---|
| 0 | Forest |
| 1 | Agriculture |
| 2 | Built-up |
| 3 | Water |
| 4 | Barren Land |

Training samples were created by merging the digitised class-specific training polygons. The classification was performed using the CART classifier implemented through the Google Earth Engine Smile CART algorithm.

Independent validation polygons were subsequently sampled from the Sentinel-2 feature stack and used to evaluate the classification.

The classification performance was assessed using a confusion matrix, overall accuracy, Kappa coefficient, producer's accuracy and user's accuracy.

#### Classification Accuracy

| Evaluation Metric | Result |
|---|---:|
| Overall Accuracy | 84.41% |
| Kappa Coefficient | 0.788 |

The results indicate reasonable agreement between the classified land cover and the independent validation observations.

### 4. Terrain Analysis and Topographic Wetness Index

The SRTM Digital Elevation Model was used to derive elevation and slope.

Slope was calculated using the terrain analysis function in Google Earth Engine.

The Topographic Wetness Index was derived using the following expression:

\[
TWI = \ln\left(\frac{FlowAccumulation}
{\tan(\beta)+0.001}\right)
\]

Where:

- Flow Accumulation represents the neighbourhood-based elevation sum calculated in the script.
- \(\beta\) represents slope angle converted from degrees to radians.
- 0.001 is a small constant introduced to prevent division by zero.

The resulting TWI values ranged approximately from 4.97 to 13.32.

### 5. Flood Susceptibility Index Modelling

Flood susceptibility was assessed using a weighted-overlay approach involving four conditioning factors:

- Land use/land cover
- Slope
- Elevation
- Topographic Wetness Index

Each conditioning factor was reclassified into five ordinal scores, with higher scores representing greater susceptibility according to the adopted scoring scheme.

The land cover classification was reclassified using the following mapping:

| Original Class | Reclassified Score |
|---|---:|
| Forest | 1 |
| Agriculture | 3 |
| Built-up | 5 |
| Water | 5 |
| Barren Land | 4 |

Slope, elevation and TWI were also reclassified using threshold-based scoring.

The Flood Susceptibility Index was calculated using the following weighted linear combination:

\[
FSI = 0.35(LC) + 0.25(Slope)
+ 0.25(TWI) + 0.15(Elevation)
\]

Where:

- LC represents the reclassified land cover score.
- Slope represents the reclassified slope score.
- TWI represents the reclassified wetness index score.
- Elevation represents the reclassified elevation score.

The resulting FSI values ranged from 1 to 5.

#### Flood Susceptibility Classification

The continuous FSI was divided into five susceptibility categories:

| FSI Range | Susceptibility Category |
|---|---|
| Up to 2.0 | Very Low |
| 2.0–2.5 | Low |
| 2.5–3.0 | Moderate |
| 3.0–3.5 | High |
| Above 3.5 | Very High |

The classified output provides a spatial representation of relative flood susceptibility across the study area.

### 6. Sensitivity Analysis

A sensitivity analysis was conducted to examine how alternative weighting assignments influenced the resulting flood susceptibility distribution.

The original weighting scheme was:

| Conditioning Factor | Original Weight |
|---|---:|
| Land Use/Land Cover | 0.35 |
| Slope | 0.25 |
| TWI | 0.25 |
| Elevation | 0.15 |

An alternative weighting scheme was subsequently applied:

| Conditioning Factor | Alternative Weight |
|---|---:|
| Land Use/Land Cover | 0.30 |
| Slope | 0.30 |
| TWI | 0.25 |
| Elevation | 0.15 |

The alternative FSI was calculated as:

\[
FSI_{sens} = 0.30(LC) + 0.30(Slope)
+ 0.25(TWI) + 0.15(Elevation)
\]

Both susceptibility surfaces were classified using the same thresholds. Their corresponding area distributions were calculated to examine the changes resulting from the alternative weighting scheme.

## Results

### 1. Land Use/Land Cover Area Distribution

The calculated land cover areas are presented below.

| Land Cover Class | Area (ha) |
|---|---:|
| Forest | 64,414.84 |
| Agriculture | 53,424.49 |
| Built-up | 3,621.10 |
| Water | 1,128.16 |
| Barren Land | 14,036.23 |
| **Total** | **136,624.81** |

Forest and agricultural land constituted the largest mapped land cover categories.

### 2. Flood Susceptibility Area Distribution

The area statistics obtained from the original FSI classification are presented below.

| Susceptibility Category | Area (ha) |
|---|---:|
| Very Low | 6,168.25 |
| Low | 24,814.07 |
| Moderate | 39,999.27 |
| High | 29,179.84 |
| Very High | 36,381.56 |
| **Total** | **136,542.99** |

The results show the spatial distribution of the five susceptibility categories across the study area.

### 3. Sensitivity Analysis Results

The alternative weighting scheme produced the following susceptibility area distribution.

| Susceptibility Category | Original Weighting (ha) | Alternative Weighting (ha) |
|---|---:|---:|
| Very Low | 6,168.25 | 6,001.06 |
| Low | 24,814.07 | 16,291.06 |
| Moderate | 39,999.27 | 27,636.75 |
| High | 29,179.84 | 40,647.83 |
| Very High | 36,381.56 | 45,966.30 |

The alternative weighting scheme increased the mapped areas classified as high and very high susceptibility, while reducing the areas classified as low and moderate susceptibility.

This demonstrates that the distribution of susceptibility classes is influenced by the relative importance assigned to the conditioning factors.

## Visual Results

The repository contains the following maps, charts and spatial outputs generated during the analysis.

### Sentinel-2 Composite and Land Cover Classification

**Sentinel-2 True Colour Composite**

![Sentinel-2 Composite](images/composite.png)

**Land Use/Land Cover Map**

![LULC](images/LULC.png)

### Spectral Indices

**Normalized Difference Vegetation Index (NDVI)**

![NDVI](images/NDVI.png)

**Normalized Difference Built-up Index (NDBI)**

![NDBI](images/NDBI.png)

**Bare Soil Index (BSI)**

![BSI](images/BSI.png)

### Terrain Characteristics

**Elevation**

![Elevation](images/Elevation.jpg)

**Slope**

![Slope](images/Slope.jpg)

**Topographic Wetness Index**

![TWI](images/TWI.jpg)

### Flood Susceptibility Assessment

**Flood Susceptibility Index**

![FSI](images/FSI.jpg)

**Flood Susceptibility Area Distribution**

![Flood Area Distribution](images/flood_area_distribution.png)

### Land Cover Statistics

**Land Use/Land Cover Area Distribution**

![LULC Area Distribution](images/lulc_area_distribution.png)

### Sensitivity Analysis

**Flood Susceptibility Area Under Alternative Weighting Schemes**

![Sensitivity Analysis](images/sensitivity_flood_area.png)

**Percentage Change in Susceptibility Classes**

![Percentage Change](images/percentage_change.png)

## Limitations

The analysis has several limitations that should be considered when interpreting the results.

The Sentinel-2 composite was generated using imagery acquired between January 2024 and December 2025. Consequently, the resulting land cover classification represents a multi-period composite rather than a strictly single-year 2024 observation. Although cloud filtering and QA60 masking were applied, residual atmospheric effects and cloud contamination may still influence the spectral information.

The CART classification achieved an overall accuracy of 84.41% and a Kappa coefficient of 0.788. However, classification errors remain across individual land cover categories and may affect the subsequent susceptibility assessment.

The flood susceptibility index was developed using a weighted-overlay approach. The assigned weights and reclassification thresholds involve judgement and may influence the resulting spatial distribution of susceptibility classes.

Flow accumulation was approximated using a neighbourhood-based summation of the elevation model rather than a hydrologically derived flow accumulation dataset. Consequently, the derived TWI should be interpreted as an approximate terrain wetness indicator rather than a conventional hydrological TWI.

The sensitivity analysis examined the effect of modifying the relative weights assigned to the conditioning factors. However, it does not independently establish the predictive accuracy of the susceptibility map.

Furthermore, the susceptibility assessment was not validated against an independent historical flood inventory. The resulting map therefore represents relative susceptibility based on the selected environmental variables and weighting assumptions, rather than measured flood probability, inundation depth or real-time flood conditions.

## Tools and Technologies

The project was implemented using the following tools and datasets:

- **Google Earth Engine:** Satellite image processing and geospatial analysis.
- **JavaScript:** Development of the remote sensing and modelling workflow.
- **Sentinel-2:** Multispectral imagery and spectral index generation.
- **SRTM DEM:** Terrain analysis and elevation modelling.
- **CART:** Supervised land cover classification.
- **GIS and Multi-Criteria Evaluation:** Weighted-overlay flood susceptibility assessment.

## Reproducibility

The Google Earth Engine JavaScript script contains the processing workflow for satellite image acquisition, cloud masking, spectral index generation, land cover classification, terrain analysis, flood susceptibility modelling, sensitivity analysis and export of the resulting spatial datasets.

To reproduce the analysis:

1. Open the Google Earth Engine Code Editor.
2. Import or define the study area boundary as `roi`.
3. Import the training polygons: `forest`, `agriculture`, `builtup`, `water` and `barren`.
4. Import the corresponding independent validation polygons.
5. Copy the JavaScript script into the Code Editor.
6. Run the script and inspect the generated map layers and console outputs.
7. Execute the export tasks to save the resulting datasets to Google Drive.

The analysis relies on publicly accessible satellite and geospatial datasets, together with the digitised training and validation polygons.

## Author

**Kelvin Akhere Moses**

B.Sc. Surveying and Geo-Informatics (First Class Honours)  
University of Benin, Nigeria

[LinkedIn](https://www.linkedin.com/in/kelvin-moses-90538023a/) | [Personal Portfolio](https://kelvinmoses.me)
