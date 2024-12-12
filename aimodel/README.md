# 🍳 Advanced Recipe Recommendation Model

## Table of Contents

1. [Introduction](#introduction)
2. [Dataset Overview](#dataset-overview)
3. [Model Overview](#model-overview)
4. [Evaluation Metrics](#evaluation-metrics)

---

## Introduction <a id="introduction"></a>

[🔝 Back to Top](#table-of-contents)

Develop an intelligent, content-based recipe recommendation system using machine learning. This system suggests recipes based on ingredients, categories, diet types, and ratings.

### 🎯 Objective

Build a sophisticated engine for personalized recipe recommendations, enabling users to explore diverse culinary options.

---

## Dataset Overview <a id="dataset-overview"></a>

[🔝 Back to Top](#table-of-contents)

Our project utilizes data scraped from [AllRecipes.com](https://www.allrecipes.com/), a leading platform for user-generated recipes.

### 🌐 Dataset Source

- **Website**: [AllRecipes.com](https://www.allrecipes.com/)
- **Dataset**: [GitHub - Scraped Data](https://github.com/shaansubbaiah/allrecipes-scraper/blob/main/export/scraped-07-05-21.csv)

### 📋 Key Features

| Feature           | Description                                   |
|-------------------|-----------------------------------------------|
| 🍽️ Recipe Titles | Names of dishes                              |
| 🥕 Ingredients    | List of required items                       |
| 📝 Instructions   | Step-by-step cooking guide                   |
| ⭐ Ratings        | User-provided scores                         |
| 💬 Reviews        | User feedback and comments                   |
| ⏱️ Prep Times     | Time required for preparation and cooking    |
| 🥗 Nutrition Info | Detailed nutritional data                    |

### 🚀 Project Relevance

This dataset allows our AI-Powered Recipe Recommender to deliver:
- Personalized recipe suggestions
- Tailored recommendations for dietary preferences
- Enhanced cooking experiences through intelligent recommendations

---

## Model Overview <a id="model-overview"></a>

[🔝 Back to Top](#table-of-contents)

Our content-based recommendation system leverages advanced machine learning techniques to provide users with tailored recipe suggestions.

### 🔧 Data Preparation & Feature Engineering

1. **Ingredient Processing** 🥕
   - Convert `high_level_ingredients` lists into strings for analysis.

2. **Feature Fusion** 🔗
   - Combine `category`, `diet_type`, and processed ingredients into a single text feature.

### 📊 Text-to-Vector Transformation

#### TF-IDF Vectorization

- **Goal**: Convert text data into numerical vectors.
- **Method**: Apply TF-IDF (Term Frequency-Inverse Document Frequency).
- **Output**: Matrix representing term importance across recipes.

### 🎛 Dimensionality Reduction

#### Principal Component Analysis (PCA)

- **Purpose**: Compress data while retaining key information.
- **Implementation**: Reduce TF-IDF matrix to 50 principal components.
- **Benefit**: Improved efficiency and reduced noise.

### 🧩 Recipe Clustering

#### KMeans Algorithm

- **Objective**: Group similar recipes for faster recommendations.
- **Configuration**: 25 clusters based on PCA-reduced features.
- **Advantage**: Efficient similarity comparisons.

### 🧠 Neural Network for Similarity Learning

#### Architecture

- **Input**: 50 PCA components.
- **Hidden Layers**: 
  - 128 neurons (ReLU activation).
  - 64 neurons (ReLU activation).
- **Output**: 25 neurons (Softmax activation) for cluster prediction.

#### Training

- **Optimizer**: Adam
- **Loss Function**: Categorical Cross-Entropy
- **Epochs**: 25
- **Batch Size**: 32
- **Validation Split**: 20%

### 🚀 Recommendation Process

1. **Cluster Prediction**: Identify the target recipe’s cluster.
2. **Similarity Calculation**: Compute cosine similarity within the cluster.
3. **Diversity Boost** (Optional): Adjust scores for varied recommendations.
4. **Top Picks**: Select top N recipes, considering diversity if enabled.

---

## Evaluation Metrics <a id="evaluation-metrics"></a>

[🔝 Back to Top](#table-of-contents)

### 🎯 Overview

Our system is evaluated using three key metrics to ensure recommendation quality and user satisfaction.

### 📈 Key Metrics

1. **Precision**
   - **Definition**: Proportion of recommended recipes that are relevant.
   - **Formula**: `relevant_recommendations / total_recommendations`
   - **Target**: > 80%

2. **Recall**
   - **Definition**: Proportion of all relevant recipes that are recommended.
   - **Formula**: `found_relevant_recipes / total_relevant_recipes`
   - **Target**: > 70%

3. **NDCG (Normalized Discounted Cumulative Gain)**
   - **Definition**: Measures ranking quality of recommendations.
   - **Formula**: `DCG / IDCG`
   - **Target**: > 85%

### 🛠️ Evaluation Techniques

1. **Cosine Similarity**
   - Measures recipe similarity.
   - Generates recommendation pairs.

2. **Diversification**
   - Ensures varied recommendations.
   - Reduces redundancy for better user experience.

3. **Clustering**
   - Groups similar recipes.
   - Facilitates efficient searching and recommendations.

### 🔄 Evaluation Process

1. **Data Preparation**
   - Split dataset into training and testing.
   - Validate data quality.
   - Normalize features.

2. **Model Training**
   - Implement neural network.
   - Learn feature vectors and compute similarities.

3. **Recommendation Generation**
   - Predict clusters and calculate similarities.
   - Apply diversification for better results.

4. **Metrics Calculation**
   - Compute precision, recall, and NDCG.
   - Average results across test cases.

---
