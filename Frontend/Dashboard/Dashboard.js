
        let crimeData = [];
        let stateChartElements = {};
        
        // Default state information (capital, CM, etc.)
        const stateInfo = {
            "Rajasthan": {
                capital: "Jaipur",
                cm: "Bhajan Lal Sharma",
                formed: "1949-03-30",
                area: "342,239 km²",
                officialLanguage: "Hindi",
                majorCities: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
                touristAttractions: ["Hawa Mahal", "Amber Fort", "Ranthambore National Park"],
                policeStations: 1200,
                safetyIndex: 7.2
            },
            "Gujarat": {
                capital: "Gandhinagar",
                cm: "Bhupendrabhai Patel",
                formed: "1960-05-01",
                area: "196,024 km²",
                officialLanguage: "Gujarati",
                majorCities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
                touristAttractions: ["Statue of Unity", "Rann of Kutch", "Gir National Park"],
                policeStations: 950,
                safetyIndex: 7.8
            },
            "Andhra Pradesh": {
                capital: "Amaravati",
                cm: "Y. S. Jagan Mohan Reddy",
                formed: "1956-11-01",
                area: "160,205 km²",
                officialLanguage: "Telugu",
                majorCities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
                touristAttractions: ["Tirumala Temple", "Araku Valley", "Borra Caves"],
                policeStations: 1100,
                safetyIndex: 6.9
            },
            // Add more states as needed
            "Maharashtra": {
                capital: "Mumbai",
                cm: "Eknath Shinde",
                formed: "1960-05-01",
                area: "307,713 km²",
                officialLanguage: "Marathi",
                majorCities: ["Mumbai", "Pune", "Nagpur", "Nashik"],
                touristAttractions: ["Gateway of India", "Ajanta & Ellora Caves", "Lonavala"],
                policeStations: 1500,
                safetyIndex: 7.5
            },
            "Uttar Pradesh": {
                capital: "Lucknow",
                cm: "Yogi Adityanath",
                formed: "1950-01-26",
                area: "243,286 km²",
                officialLanguage: "Hindi",
                majorCities: ["Lucknow", "Kanpur", "Varanasi", "Agra"],
                touristAttractions: ["Taj Mahal", "Varanasi Ghats", "Ayodhya"],
                policeStations: 1800,
                safetyIndex: 6.5
            }
        };

        async function fetchData() {
            try {
                const response = await fetch("crimeReport.xlsx");
                const data = await response.arrayBuffer();
                const workbook = XLSX.read(data, { type: "array" });
                
                // First sheet contains crime statistics
                const statsSheet = workbook.Sheets[workbook.SheetNames[0]];
                const statsJson = XLSX.utils.sheet_to_json(statsSheet, { header: 1 });
                
                // Process crime statistics
                statsJson.forEach((row, rowIndex) => {
                    if (rowIndex === 0) return; // Skip header row
                    crimeData.push({
                        state: row[0],
                        year: row[1],
                        theft: row[2] || 0,
                        murder: row[3] || 0,
                        assault: row[4] || 0,
                        rape: row[5] || 0,
                    });
                });

                populateStateDropdown();
                plotOverallCharts();
                plotStateCharts();
                setupMapInteractivity();
            } catch (error) {
                console.error("Error loading data:", error);
                alert("Failed to load data. Please check if crimeReport.xlsx is available.");
            }
        }

        function populateStateDropdown() {
            const dropdown = document.getElementById('stateDropdown');
            const states = [...new Set(crimeData.map((data) => data.state))];
            
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.replace(/\s+/g, '');
                option.textContent = state;
                dropdown.appendChild(option);
            });
            
            dropdown.addEventListener('change', function() {
                const selectedState = this.options[this.selectedIndex].text;
                if (selectedState) {
                    scrollToState(selectedState);
                }
            });
        }

        function setupMapInteractivity() {
            document.querySelectorAll('map area').forEach(area => {
                area.addEventListener('click', function(e) {
                    e.preventDefault();
                    const state = this.getAttribute('data-state');
                    scrollToState(state);
                    
                    const dropdown = document.getElementById('stateDropdown');
                    for (let i = 0; i < dropdown.options.length; i++) {
                        if (dropdown.options[i].text === state) {
                            dropdown.selectedIndex = i;
                            break;
                        }
                    }
                });
            });
        }

        function scrollToState(stateName) {
            const stateId = `stateChart${stateName.replace(/\s+/g, '')}`;
            const element = document.getElementById(stateId);
            
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Highlight the section
                const section = element.closest('.state-chart-section');
                section.style.backgroundColor = '#f0f8ff';
                setTimeout(() => {
                    section.style.backgroundColor = '';
                }, 2000);
            }
        }

        function plotOverallCharts() {
            const labels = [...new Set(crimeData.map((data) => data.year))].sort();
            
            // Calculate totals for each crime type across all years
            const theftData = labels.map((year) =>
                crimeData
                    .filter((data) => data.year === year)
                    .reduce((sum, data) => sum + (data.theft || 0), 0)
            );
            const murderData = labels.map((year) =>
                crimeData
                    .filter((data) => data.year === year)
                    .reduce((sum, data) => sum + (data.murder || 0), 0)
            );
            const assaultData = labels.map((year) =>
                crimeData
                    .filter((data) => data.year === year)
                    .reduce((sum, data) => sum + (data.assault || 0), 0)
            );
            const rapeData = labels.map((year) =>
                crimeData
                    .filter((data) => data.year === year)
                    .reduce((sum, data) => sum + (data.rape || 0), 0)
            );

            // Overall Bar Chart
            const ctxOverallBar = document.getElementById("overallBarChart").getContext("2d");
            new Chart(ctxOverallBar, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Theft",
                            data: theftData,
                            backgroundColor: "rgba(75, 192, 192, 0.6)",
                        },
                        {
                            label: "Murder",
                            data: murderData,
                            backgroundColor: "rgba(255, 99, 132, 0.6)",
                        },
                        {
                            label: "Assault",
                            data: assaultData,
                            backgroundColor: "rgba(255, 206, 86, 0.6)",
                        },
                        {
                            label: "Rape",
                            data: rapeData,
                            backgroundColor: "rgba(54, 162, 235, 0.6)",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'National Crime Trends by Year'
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Cases'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            }
                        }
                    },
                },
            });

            // Overall Pie Chart
            const ctxOverallPie = document.getElementById("overallPieChart").getContext("2d");
            new Chart(ctxOverallPie, {
                type: "pie",
                data: {
                    labels: ["Theft", "Murder", "Assault", "Rape"],
                    datasets: [
                        {
                            label: "Overall Crime Distribution",
                            data: [
                                theftData.reduce((a, b) => a + b, 0),
                                murderData.reduce((a, b) => a + b, 0),
                                assaultData.reduce((a, b) => a + b, 0),
                                rapeData.reduce((a, b) => a + b, 0),
                            ],
                            backgroundColor: [
                                "rgba(75, 192, 192, 0.6)",
                                "rgba(255, 99, 132, 0.6)",
                                "rgba(255, 206, 86, 0.6)",
                                "rgba(54, 162, 235, 0.6)",
                            ],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'National Crime Distribution'
                        },
                        legend: {
                            position: 'right',
                        }
                    }
                },
            });

            // Overall Line Chart
            const ctxOverallLine = document.getElementById("overallLineChart").getContext("2d");
            new Chart(ctxOverallLine, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Theft",
                            data: theftData,
                            borderColor: "rgba(75, 192, 192, 1)",
                            backgroundColor: "rgba(75, 192, 192, 0.1)",
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: "Murder",
                            data: murderData,
                            borderColor: "rgba(255, 99, 132, 1)",
                            backgroundColor: "rgba(255, 99, 132, 0.1)",
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: "Assault",
                            data: assaultData,
                            borderColor: "rgba(255, 206, 86, 1)",
                            backgroundColor: "rgba(255, 206, 86, 0.1)",
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: "Rape",
                            data: rapeData,
                            borderColor: "rgba(54, 162, 235, 1)",
                            backgroundColor: "rgba(54, 162, 235, 0.1)",
                            fill: true,
                            tension: 0.3
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'National Crime Trends Over Time'
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Cases'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            }
                        }
                    },
                },
            });
        }

        function plotStateCharts() {
            const states = [...new Set(crimeData.map((data) => data.state))];
            
            states.forEach((state) => {
                const stateData = crimeData.filter((data) => data.state === state);
                const stateLabels = [...new Set(stateData.map((data) => data.year))].sort();
                
                const stateTheftData = stateLabels.map((year) =>
                    stateData
                        .filter((data) => data.year === year)
                        .reduce((sum, data) => sum + (data.theft || 0), 0)
                );
                const stateMurderData = stateLabels.map((year) =>
                    stateData
                        .filter((data) => data.year === year)
                        .reduce((sum, data) => sum + (data.murder || 0), 0)
                );
                const stateAssaultData = stateLabels.map((year) =>
                    stateData
                        .filter((data) => data.year === year)
                        .reduce((sum, data) => sum + (data.assault || 0), 0)
                );
                const stateRapeData = stateLabels.map((year) =>
                    stateData
                        .filter((data) => data.year === year)
                        .reduce((sum, data) => sum + (data.rape || 0), 0)
                );

                // Calculate totals for pie chart
                const totalTheft = stateTheftData.reduce((a, b) => a + b, 0);
                const totalMurder = stateMurderData.reduce((a, b) => a + b, 0);
                const totalAssault = stateAssaultData.reduce((a, b) => a + b, 0);
                const totalRape = stateRapeData.reduce((a, b) => a + b, 0);
                
                // Get state information from our default dataset
                const info = stateInfo[state] || {
                    capital: "Not available",
                    cm: "Not available",
                    formed: "Not available",
                    area: "Not available",
                    officialLanguage: "Not available",
                    majorCities: ["Not available"],
                    touristAttractions: ["Not available"],
                    policeStations: "Not available",
                    safetyIndex: "Not available"
                };

                // Create state section container
                const stateSection = document.createElement("div");
                stateSection.className = "state-chart-section";
                stateSection.id = `stateSection-${state.replace(/\s+/g, '')}`;
                
                // State header
                const stateHeader = document.createElement("h3");
                stateHeader.className = "mt-5 mb-4 state-section";
                stateHeader.id = `stateChart${state.replace(/\s+/g, '')}`;
                stateHeader.textContent = `${state} Crime Statistics`;
                stateSection.appendChild(stateHeader);
                
                // State info row
                const infoRow = document.createElement("div");
                infoRow.className = "row";
                
                // State information card
                const infoCol = document.createElement("div");
                infoCol.className = "col-md-4";
                
                const infoCard = document.createElement("div");
                infoCard.className = "card state-info-card";
                
                let infoContent = `<div class="card-body">
                    <h5 class="card-title">${state} Overview</h5>
                    <div class="state-details">
                        <p><strong>Capital:</strong> ${info.capital}</p>
                        <p><strong>Chief Minister:</strong> ${info.cm}</p>
                        <p><strong>Formed:</strong> ${info.formed}</p>
                        <p><strong>Area:</strong> ${info.area}</p>
                        <p><strong>Official Language:</strong> ${info.officialLanguage}</p>
                        <p><strong>Major Cities:</strong> ${info.majorCities.join(", ")}</p>
                        <p><strong>Police Stations:</strong> ${info.policeStations}</p>
                        <p><strong>Safety Index:</strong> ${info.safetyIndex}</p>
                    </div>`;
                
                if (info.touristAttractions && info.touristAttractions[0] !== "Not available") {
                    infoContent += `
                    <div class="highlight-box">
                        <h6>Tourist Attractions:</h6>
                        <ul>${info.touristAttractions.map(attr => `<li>${attr}</li>`).join('')}</ul>
                    </div>`;
                }
                
                infoContent += `</div>`;
                infoCard.innerHTML = infoContent;
                infoCol.appendChild(infoCard);
                infoRow.appendChild(infoCol);
                
                // Quick stats cards
                const statsCol = document.createElement("div");
                statsCol.className = "col-md-8";
                
                const statsRow = document.createElement("div");
                statsRow.className = "row";
                
                // Theft card
                statsRow.innerHTML += `
                <div class="col-md-3">
                    <div class="stat-card theft">
                        <h5>Theft Cases</h5>
                        <h3>${totalTheft.toLocaleString()}</h3>
                    </div>
                </div>`;
                
                // Murder card
                statsRow.innerHTML += `
                <div class="col-md-3">
                    <div class="stat-card murder">
                        <h5>Murder Cases</h5>
                        <h3>${totalMurder.toLocaleString()}</h3>
                    </div>
                </div>`;
                
                // Assault card
                statsRow.innerHTML += `
                <div class="col-md-3">
                    <div class="stat-card assault">
                        <h5>Assault Cases</h5>
                        <h3>${totalAssault.toLocaleString()}</h3>
                    </div>
                </div>`;
                
                // Rape card
                statsRow.innerHTML += `
                <div class="col-md-3">
                    <div class="stat-card rape">
                        <h5>Rape Cases</h5>
                        <h3>${totalRape.toLocaleString()}</h3>
                    </div>
                </div>`;
                
                statsCol.appendChild(statsRow);
                infoRow.appendChild(statsCol);
                stateSection.appendChild(infoRow);
                
                // Charts row
                const chartsRow = document.createElement("div");
                chartsRow.className = "row mt-3";
                
                // Bar chart column
                const barCol = document.createElement("div");
                barCol.className = "col-md-6";
                barCol.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${state} Crime Trends</h5>
                            <canvas id="stateBarChart${state.replace(/\s+/g, '')}"></canvas>
                        </div>
                    </div>`;
                chartsRow.appendChild(barCol);
                
                // Pie chart column
                const pieCol = document.createElement("div");
                pieCol.className = "col-md-6";
                pieCol.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${state} Crime Distribution</h5>
                            <canvas id="statePieChart${state.replace(/\s+/g, '')}"></canvas>
                        </div>
                    </div>`;
                chartsRow.appendChild(pieCol);
                
                stateSection.appendChild(chartsRow);
                
                // Add to DOM
                document.getElementById("stateCharts").appendChild(stateSection);
                
                // State Bar Chart
                const ctxStateBar = document.getElementById(`stateBarChart${state.replace(/\s+/g, '')}`).getContext("2d");
                new Chart(ctxStateBar, {
                    type: "bar",
                    data: {
                        labels: stateLabels,
                        datasets: [
                            {
                                label: "Theft",
                                data: stateTheftData,
                                backgroundColor: "rgba(75, 192, 192, 0.6)",
                            },
                            {
                                label: "Murder",
                                data: stateMurderData,
                                backgroundColor: "rgba(255, 99, 132, 0.6)",
                            },
                            {
                                label: "Assault",
                                data: stateAssaultData,
                                backgroundColor: "rgba(255, 206, 86, 0.6)",
                            },
                            {
                                label: "Rape",
                                data: stateRapeData,
                                backgroundColor: "rgba(54, 162, 235, 0.6)",
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: `${state} Crime Trends by Year`
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Cases'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Year'
                                }
                            }
                        },
                    },
                });
                
                // State Pie Chart
                const ctxStatePie = document.getElementById(`statePieChart${state.replace(/\s+/g, '')}`).getContext("2d");
                new Chart(ctxStatePie, {
                    type: "pie",
                    data: {
                        labels: ["Theft", "Murder", "Assault", "Rape"],
                        datasets: [
                            {
                                label: "Crime Distribution",
                                data: [totalTheft, totalMurder, totalAssault, totalRape],
                                backgroundColor: [
                                    "rgba(75, 192, 192, 0.6)",
                                    "rgba(255, 99, 132, 0.6)",
                                    "rgba(255, 206, 86, 0.6)",
                                    "rgba(54, 162, 235, 0.6)",
                                ],
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: `${state} Crime Distribution`
                            },
                            legend: {
                                position: 'right',
                            }
                        }
                    },
                });
            });
        }

        // Call the fetchData function on page load
        window.onload = fetchData;
  