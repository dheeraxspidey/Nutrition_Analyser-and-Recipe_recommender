// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Common functionality
    setupModals();

    // Check which page we're on and run the appropriate code
    if (document.getElementById('nutrition-search')) {
        initNutritionSearch();
    } else if (document.getElementById('recommendation-search')) {
        initRecipeRecommendations();
    } else if (document.getElementById('filtered-search')) {
        initFilteredSearch();
    }
});

function setupModals() {
    // Setup for recipe modal
    var recipeModal = document.getElementById('recipeModal');
    if (recipeModal) {
        var span = recipeModal.getElementsByClassName('close')[0];
        span.onclick = function() {
            recipeModal.style.display = 'none';
        }
    }

    // Setup for filtered recipe modal
    var filteredModal = document.getElementById('filteredRecipeModal');
    if (filteredModal) {
        var filteredSpan = filteredModal.getElementsByClassName('close')[0];
        filteredSpan.onclick = function() {
            filteredModal.style.display = 'none';
        }
    }

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target == recipeModal) {
            recipeModal.style.display = 'none';
        }
        if (event.target == filteredModal) {
            filteredModal.style.display = 'none';
        }
    }
}

function initNutritionSearch() {
    document.getElementById('searchBtn').addEventListener('click', async function() {
        const searchQuery = document.getElementById("search").value;

        const appId = "afef2ac3";
        const apiKey = "0a409dbe12f4e9c0d6c44f2358c75176";
        const apiUrl = "https://trackapi.nutritionix.com/v2/natural/nutrients";

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-app-id': appId,
                    'x-app-key': apiKey
                },
                body: JSON.stringify({ query: searchQuery })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching data. Please try again later.');
        }
    });
}

function displayResults(data) {
    // console.log(data);
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = ""; // Clear previous results

    if (data.foods && data.foods.length > 0) {
        let overallNutrition = {
            calories: 0,
            fat: 0,
            carbs: 0,
            protein: 0
        };

        data.foods.forEach((food, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'food-card';
            
            // Calculate daily value percentages (based on standard 2000 calorie diet)
            const dailyValues = {
                protein: (food.nf_protein / 50) * 100, // 50g is recommended daily value
                fiber: (food.nf_dietary_fiber / 28) * 100, // 28g is recommended daily value
                potassium: (food.nf_potassium / 3500) * 100, // 3500mg is recommended daily value
                sodium: (food.nf_sodium / 2300) * 100 // 2300mg is recommended daily value
            };

            // Generate health insights based on nutritional content
            const healthInsights = [];
            
            // Protein content insights
            if (food.nf_protein > 20) healthInsights.push('Excellent source of protein (muscle building)');
            else if (food.nf_protein > 10) healthInsights.push('Good source of protein');

            // Fiber content insights
            if (food.nf_dietary_fiber > 5) healthInsights.push('High in fiber (aids digestion)');
            else if (food.nf_dietary_fiber > 2.5) healthInsights.push('Good source of fiber');

            // Sodium insights
            if (food.nf_sodium < 140) healthInsights.push('Low sodium (heart-healthy)');
            else if (food.nf_sodium > 500) healthInsights.push('High sodium content');

            // Potassium insights
            if (food.nf_potassium > 350) healthInsights.push('Rich in potassium (supports blood pressure)');

            // Serving size information
            const servingInfo = food.alt_measures ? 
                `<p>Alternative serving sizes: ${food.alt_measures.map(m => `${m.serving_weight}g (${m.measure})`).join(', ')}</p>` : '';

            cardDiv.innerHTML = `
                <div class="food-info">
                    <img src="${food.photo.highres}" alt="${food.food_name}">
                    <h3>${food.food_name}</h3>
                    <p>Serving: ${food.serving_qty} ${food.serving_unit} (${food.serving_weight_grams}g)</p>
                    ${servingInfo}
                    <p>Calories: ${food.nf_calories.toFixed(1)}</p>
                    <p>Fat: ${food.nf_total_fat.toFixed(1)}g</p>
                    <p>Carbs: ${food.nf_total_carbohydrate.toFixed(1)}g</p>
                    <p>Protein: ${food.nf_protein.toFixed(1)}g</p>
                    <canvas class="nutritionChart" id="nutritionChart-${index}"></canvas>
                </div>
                <div class="health-benefits">
                    <h3>Health Benefits:</h3>
                    <ul>
                        ${healthInsights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                    <h4>Daily Value Percentages:</h4>
                    <ul>
                        <li>Protein: ${dailyValues.protein.toFixed(1)}% of daily value</li>
                        <li>Fiber: ${dailyValues.fiber.toFixed(1)}% of daily value</li>
                        <li>Potassium: ${dailyValues.potassium.toFixed(1)}% of daily value</li>
                        <li>Sodium: ${dailyValues.sodium.toFixed(1)}% of daily value</li>
                    </ul>
                </div>
            `;
            resultDiv.appendChild(cardDiv);

            // Accumulate overall nutrition data
            overallNutrition.calories += food.nf_calories;
            overallNutrition.fat += food.nf_total_fat;
            overallNutrition.carbs += food.nf_total_carbohydrate;
            overallNutrition.protein += food.nf_protein;

            // Create individual charts
            createNutrientChart(food, index);
        });

        // Create overall chart
        createOverallNutrientChart(overallNutrition);
    } else {
        resultDiv.innerHTML = "<p>No results found.</p>";
    }
}

function createNutrientChart(food, index) {
    // Get the original canvas
    const originalCanvas = document.getElementById(`nutritionChart-${index}`);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'nutrition-charts-container';
    
    // Create two new canvas elements
    const macroCanvas = document.createElement('canvas');
    macroCanvas.id = `macroChart-${index}`;
    const mineralsCanvas = document.createElement('canvas');
    mineralsCanvas.id = `mineralsChart-${index}`;
    
    // Create wrapper divs for each chart
    const macroDiv = document.createElement('div');
    macroDiv.className = 'macro-chart';
    const mineralsDiv = document.createElement('div');
    mineralsDiv.className = 'minerals-chart';
    mineralsDiv.style.width = '100%'; // Ensure full width
    mineralsDiv.style.minHeight = '200px'; // Add minimum height
    
    // Append canvases to their respective divs
    macroDiv.appendChild(macroCanvas);
    mineralsDiv.appendChild(mineralsCanvas);
    
    // Append both divs to container
    container.appendChild(macroDiv);
    container.appendChild(mineralsDiv);
    
    // Replace original canvas with new container
    originalCanvas.parentNode.replaceChild(container, originalCanvas);

    // Group nutrients by category
    const nutrientGroups = {
        macros: {
            title: 'Macronutrients (g)',
            data: [
                { label: 'Protein', value: food.nf_protein || 0, color: '#FF6B6B', icon: '💪' },
                { label: 'Carbs', value: food.nf_total_carbohydrate || 0, color: '#4ECDC4', icon: '🌾' },
                { label: 'Fat', value: food.nf_total_fat || 0, color: '#45B7D1', icon: '🥑' }
            ]
        },
        minerals: {
            title: 'Minerals (% Daily Value)',
            data: [
                { label: 'Iron', value: ((food.nf_iron|| 0) / 18) * 100, color: '#96CEB4', icon: '🔨' },
                { label: 'Calcium', value: ((food.nf_calcium|| 0) / 1300) * 100, color: '#88D8B0', icon: '🦴' },
                { label: 'Potassium', value: ((food.nf_potassium || 0) / 3500) * 100, color: '#FF6F69', icon: '🍌' },
                { label: 'Zinc', value: ((food.nf_zinc|| 0) / 11) * 100, color: '#FFCC5C', icon: '🛡️' }
            ]
        }
    };

    // Create macro gauge chart
    const macroChart = new Chart(macroCanvas, {
        type: 'polarArea',
        data: {
            labels: nutrientGroups.macros.data.map(item => `${item.icon} ${item.label}`),
            datasets: [{
                data: nutrientGroups.macros.data.map(item => item.value),
                backgroundColor: nutrientGroups.macros.data.map(item => item.color),
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Macronutrient Distribution'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = nutrientGroups.macros.data.reduce((sum, item) => sum + item.value, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${value.toFixed(1)}g (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    ticks: { display: false },
                    grid: { display: false }
                }
            }
        }
    });

    // Create minerals bar chart
    const mineralsChart = new Chart(mineralsCanvas, {
        type: 'bar',
        data: {
            labels: nutrientGroups.minerals.data.map(item => `${item.icon} ${item.label}`),
            datasets: [{
                data: nutrientGroups.minerals.data.map(item => Math.min(item.value, 200)), // Cap at 200%
                backgroundColor: nutrientGroups.minerals.data.map(item => item.color),
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false, // Allow chart to ignore aspect ratio
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Daily Value (%)'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const originalValue = nutrientGroups.minerals.data[context.dataIndex].value;
                            return `${originalValue.toFixed(1)}% of daily value`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    max: 200,
                    grid: { display: false },
                    ticks: {
                        callback: value => `${value}%`,
                        stepSize: 50
                    }
                },
                y: {
                    grid: { display: false }
                }
            }
        }
    });
}

function createOverallNutrientChart(overallNutrition) {
    const canvas = document.getElementById('overallNutritionChart');
    const ctx = canvas.getContext('2d');

    // Remove any existing chart
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const data = {
        labels: ['Fat', 'Carbs', 'Protein'],
        datasets: [{
            data: [overallNutrition.fat, overallNutrition.carbs, overallNutrition.protein],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)'
            ]
        }]
    };

    canvas.chart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Overall Nutritional Breakdown'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toFixed(2) + 'g';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function initRecipeRecommendations() {
    // Setup for recipe recommendations
}

function showSuggestions(value) {
    // console.log("Searching for suggestions for:", value); // Debugging line
    if (value.length === 0) {
        document.getElementById("suggestions").innerHTML = "";
        return;
    }
    $.ajax({
        url: 'http://127.0.0.1:5000/autocomplete',
        method: 'GET',
        data: { query: value },
        success: function (data) {
            console.log("Received suggestions:", data); // Debugging line
            let suggestions = data.suggestions.map(s => `<div onclick="selectSuggestion('${s}')">${s}</div>`).join('');
            document.getElementById("suggestions").innerHTML = suggestions;
        },
        error: function (xhr, status, error) {
            console.error("Error fetching suggestions:", error); // Debugging line
        }
    });
}

function selectSuggestion(suggestion) {
    document.getElementById("recipe-name").value = suggestion;
    document.getElementById("suggestions").innerHTML = "";
}

function getRecommendations() {
    const recipeName = document.getElementById("recipe-name").value;
    $.ajax({
        url: 'http://127.0.0.1:5000/recommend',
        method: 'POST',
        data: { recipe_name: recipeName },
        success: function (data) {
            console.log(data); // Log the entire response
            if (data.recipes && Array.isArray(data.recipes)) {
                let results = data.recipes.map(recipe => 
                    `<div class="recipe-item" onclick='showRecipeDetails(${JSON.stringify(recipe).replace(/"/g, '&quot;')})'>
                        ${recipe['Recipe Name']} - ${recipe['Rating']}
                    </div>`
                ).join('');
                document.getElementById("recommendation-results").innerHTML = results;
            } else {
                console.error('Expected recipes to be an array but got:', data.recipes);
                document.getElementById("recommendation-results").innerHTML = `<div>Error fetching recommendations.</div>`;
            }
        },
        error: function (xhr, status, error) {
            console.error('Error fetching recommendations:', error);
            document.getElementById("recommendation-results").innerHTML = `<div>Error fetching recommendations.</div>`;
        }
    });
}

function showRecipeDetails(recipe) {
    const modal = document.getElementById('recipeModal');
    const modalRecipeName = document.getElementById('modalRecipeName');
    const modalIngredients = document.getElementById('modalIngredients');
    const modalDirections = document.getElementById('modalDirections');

    // Clear all previous content
    modalRecipeName.textContent = '';
    modalIngredients.innerHTML = '';
    modalDirections.textContent = '';
    
    // Remove any previously added additional details
    const existingAdditionalDetails = modal.querySelector('.additional-details');
    if (existingAdditionalDetails) {
        existingAdditionalDetails.remove();
    }

    // Add new content
    modalRecipeName.textContent = recipe['Recipe Name'];
    
    // Add each ingredient as a list item
    recipe['Ingredients'].split(',').forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = ingredient.trim();
        modalIngredients.appendChild(li);
    });

    modalDirections.textContent = recipe['Directions'];

    // Add additional details
    const additionalDetails = document.createElement('div');
    additionalDetails.className = 'additional-details';
    additionalDetails.innerHTML = `
        <p><strong>Category:</strong> ${recipe['Category']}</p>
        <p><strong>Calories:</strong> ${recipe['Calories (kcal)']}</p>
        <p><strong>Servings:</strong> ${recipe['Servings']}</p>
        <p><strong>Carbohydrates:</strong> ${recipe['Carbohydrates g(Daily %)']}</p>
        <p><strong>Sugars:</strong> ${recipe['Sugars g(Daily %)']}</p>
        <p><strong>Fat:</strong> ${recipe['Fat g(Daily %)']}</p>
        <p><strong>Protein:</strong> ${recipe['Protein g(Daily %)']}</p>
        <p><strong>Cook Time:</strong> ${recipe['Cook Time (minutes)']} minutes</p>
        <p><strong>Rating:</strong> ${recipe['Rating']} (${recipe['Rating Count']} ratings)</p>
        <p><strong>Diet Type:</strong> ${recipe['Diet Type']}</p>
    `;
    modalDirections.after(additionalDetails);

    // Show the modal
    modal.style.display = 'block';
}

function initFilteredSearch() {
    // Setup for filtered search
}

function filterRecipes() {
    // Get filter values
    const category = document.getElementById('category').value;
    const dietType = document.getElementById('diet-type').value;
    const ingredients = document.getElementById('ingredients').value;
    const servingOne = document.getElementById('serving-one').checked;
    const servingTwo = document.getElementById('serving-two').checked;
    const servingCrowd = document.getElementById('serving-crowd').checked;
    const quickAndEasy = document.getElementById('quick-and-easy').checked;

    // Prepare the form data
    const formData = new FormData();
    formData.append('category', category);
    formData.append('diet_type', dietType);
    formData.append('ingredients', ingredients);
    if (servingOne) formData.append('serving_one', 'on');
    if (servingTwo) formData.append('serving_two', 'on');
    if (servingCrowd) formData.append('serving_crowd', 'on');
    if (quickAndEasy) formData.append('quick_and_easy', 'on');

    // Send a POST request to the server
    fetch('http://localhost:5000/filter', {  // Update this URL
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // console.log("Received filtered recipes:", data);
        if (Array.isArray(data.recipes) && data.recipes.length > 0) {
            displayFilteredResults(data.recipes);
        } else {
            console.log("No recipes found or invalid data received");
            document.getElementById('filtered-results').innerHTML = '<p>No recipes found matching your criteria.</p>';
        }
    })
    .catch((error) => {
        console.error('Error in filterRecipes:', error);
        document.getElementById('filtered-results').innerHTML = '<p>An error occurred while fetching recipes. Please try again.</p>';
    });
}

// Helper functions
function formatIngredients(ingredients) {
    return ingredients.split(',').map(ingredient => `<li>${ingredient.trim()}</li>`).join('');
}

function formatValue(value) {
    return value || 'N/A';
}

function displayFilteredResults(recipes) {
    const resultsContainer = document.getElementById('filtered-results');
    resultsContainer.innerHTML = ''; // Clear previous results

    console.log("Raw recipes data:", recipes);

    if (!Array.isArray(recipes) || recipes.length === 0) {
        resultsContainer.innerHTML = '<p>No recipes found matching your criteria.</p>';
        return;
    }

    recipes.forEach((recipe, index) => {
        console.log(`Recipe ${index}:`, recipe);
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-item';
        recipeCard.innerHTML = `
            <h3>${recipe.name || 'Unnamed Recipe'}</h3>
            <p>Category: ${recipe.category || 'N/A'}</p>
            <p>Calories: ${recipe.calories || 'N/A'}</p>
            <p>Cook Time: ${recipe.cook_time_mins || 'N/A'} minutes</p>
            <p>Rating: ${recipe.rating || 'N/A'} (${recipe.rating_count || 'N/A'} ratings)</p>
        `;
        
        recipeCard.addEventListener('click', function() {
            console.log(`Clicked recipe ${index}:`, recipe);
            showFilteredRecipeDetails(recipe);
        });
        
        resultsContainer.appendChild(recipeCard);
    });

    console.log(`Displayed ${recipes.length} recipes`);
}

function showFilteredRecipeDetails(recipe) {
    console.log("Showing details for recipe:", recipe['Recipe Name'] || recipe.name);
    
    const modal = document.getElementById('filteredRecipeModal');
    const modalRecipeName = document.getElementById('filteredModalRecipeName');
    const modalIngredients = document.getElementById('filteredModalIngredients');
    const modalDirections = document.getElementById('filteredModalDirections');
    const modalAdditionalDetails = document.getElementById('filteredModalAdditionalDetails');

    modalRecipeName.textContent = recipe['Recipe Name'] || recipe.name || 'Unnamed Recipe';
    modalIngredients.innerHTML = ''; // Clear previous ingredients
    modalDirections.textContent = recipe['Directions'] || recipe.directions || 'Directions not available';
    
    if (recipe['Ingredients'] || recipe.ingredients) {
        (recipe['Ingredients'] || recipe.ingredients).split(',').forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient.trim();
            modalIngredients.appendChild(li);
        });
    }

    modalAdditionalDetails.innerHTML = `
        <p><strong>Calories:</strong> ${recipe['Calories (kcal)'] || recipe.calories || 'N/A'}</p>
        <p><strong>Servings:</strong> ${recipe['Servings'] || recipe.servings || 'N/A'}</p>
        <p><strong>Cook Time:</strong> ${recipe['Cook Time (minutes)'] || recipe.cook || 'N/A'}</p>
        <p><strong>Rating:</strong> ${recipe['Rating'] || recipe.rating || 'N/A'} (${recipe['Rating Count'] || recipe.rating_count || 'N/A'} ratings)</p>
        <p><strong>Diet Type:</strong> ${recipe['Diet Type'] || recipe.diet_type || 'N/A'}</p>
        <p><strong>Carbohydrates:</strong> ${recipe['Carbohydrates g(Daily %)'] || 'N/A'}</p>
        <p><strong>Sugars:</strong> ${recipe['Sugars g(Daily %)'] || 'N/A'}</p>
        <p><strong>Fat:</strong> ${recipe['Fat g(Daily %)'] || 'N/A'}</p>
        <p><strong>Protein:</strong> ${recipe['Protein g(Daily %)'] || 'N/A'}</p>
    `;

    modal.style.display = 'block';
}

// Make sure you have these event listeners for closing the modal
