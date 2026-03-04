class MoodTracker {
    constructor() {
        this.moods = [];
        this.selectedMood = null;
        this.editingEntry = null;
        this.chart = null;
        
        this.init();
    }

    init() {
        this.loadMoods();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.displayHistory();
        this.updateStats();
        this.initChart();
        this.checkTodayEntry();
    }

    setupEventListeners() {
        // Sélection d'humeur
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectMood(e.currentTarget);
            });
        });

        // Sauvegarde
        document.getElementById('saveMood').addEventListener('click', () => {
            this.saveMood();
        });

        // Effacer le formulaire
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearForm();
        });

        // Filtre d'historique
        document.getElementById('filterPeriod').addEventListener('change', (e) => {
            this.filterHistory(e.target.value);
        });

        // Filtre de graphique
        document.getElementById('chartPeriod').addEventListener('change', (e) => {
            this.updateChart(e.target.value);
        });

        // Modal d'édition
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('updateMood').addEventListener('click', () => {
            this.updateMood();
        });

        // Modal mood selection
        document.querySelectorAll('.modal .mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectModalMood(e.currentTarget);
            });
        });

        // Cliquer en dehors du modal pour fermer
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = today.toLocaleDateString('fr-FR', options);
    }

    selectMood(button) {
        document.querySelectorAll('.mood-input-section .mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
        this.selectedMood = {
            type: button.dataset.mood,
            value: parseInt(button.dataset.value),
            emoji: button.querySelector('.mood-emoji').textContent,
            label: button.querySelector('.mood-label').textContent
        };
    }

    selectModalMood(button) {
        document.querySelectorAll('.modal .mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
        this.selectedMood = {
            type: button.dataset.mood,
            value: parseInt(button.dataset.value),
            emoji: button.querySelector('.mood-emoji').textContent,
            label: button.querySelector('.mood-label').textContent
        };
    }

    saveMood() {
        if (!this.selectedMood) {
            this.showNotification('Veuillez sélectionner une humeur', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const note = document.getElementById('moodNote').value.trim();

        // Vérifier si une entrée existe déjà pour aujourd'hui
        if (this.moods.find(mood => mood.date === today)) {
            this.showNotification('Vous avez déjà enregistré votre humeur aujourd\'hui', 'warning');
            return;
        }

        const newMood = {
            id: Date.now(),
            date: today,
            mood: this.selectedMood,
            note: note,
            timestamp: new Date().toISOString()
        };

        this.moods.push(newMood);
        this.saveMoods();
        this.clearForm();
        this.displayHistory();
        this.updateStats();
        this.updateChart();
        this.checkTodayEntry();
        
        this.showNotification('Humeur enregistrée avec succès !', 'success');
    }

    clearForm() {
        document.querySelectorAll('.mood-input-section .mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('moodNote').value = '';
        this.selectedMood = null;
    }

    loadMoods() {
        const saved = localStorage.getItem('moodTrackerData');
        if (saved) {
            this.moods = JSON.parse(saved);
        }
    }

    saveMoods() {
        localStorage.setItem('moodTrackerData', JSON.stringify(this.moods));
    }

    displayHistory(filteredMoods = null) {
        const historyContainer = document.getElementById('moodHistory');
        const moodsToDisplay = filteredMoods || this.moods;
        
        if (moodsToDisplay.length === 0) {
            historyContainer.innerHTML = '<p class="no-data">Aucune entrée pour le moment</p>';
            return;
        }

        // Trier par date décroissante
        const sortedMoods = [...moodsToDisplay].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        historyContainer.innerHTML = sortedMoods.map(mood => {
            const date = new Date(mood.date);
            const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
            const formattedDate = date.toLocaleDateString('fr-FR', dateOptions);
            
            return `
                <div class="mood-entry" data-id="${mood.id}">
                    <div class="mood-entry-info">
                        <span class="mood-entry-emoji">${mood.mood.emoji}</span>
                        <div class="mood-entry-details">
                            <div class="mood-entry-date">${formattedDate}</div>
                            <div class="mood-entry-mood">${mood.mood.label}</div>
                            ${mood.note ? `<div class="mood-entry-note">${mood.note}</div>` : ''}
                        </div>
                    </div>
                    <div class="mood-entry-actions">
                        <button class="btn-small btn-edit" onclick="moodTracker.editMood(${mood.id})">Modifier</button>
                        <button class="btn-small btn-delete" onclick="moodTracker.deleteMood(${mood.id})">Supprimer</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    editMood(id) {
        const mood = this.moods.find(m => m.id === id);
        if (!mood) return;

        this.editingEntry = mood;
        
        // Remplir le modal
        document.getElementById('editMoodNote').value = mood.note || '';
        
        // Sélectionner l'humeur actuelle
        document.querySelectorAll('.modal .mood-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood === mood.mood.type) {
                btn.classList.add('selected');
                this.selectedMood = mood.mood;
            }
        });

        // Ouvrir le modal
        document.getElementById('editModal').style.display = 'block';
    }

    updateMood() {
        if (!this.editingEntry || !this.selectedMood) {
            this.showNotification('Veuillez sélectionner une humeur', 'error');
            return;
        }

        const note = document.getElementById('editMoodNote').value.trim();
        
        // Mettre à jour l'entrée
        const index = this.moods.findIndex(m => m.id === this.editingEntry.id);
        if (index !== -1) {
            this.moods[index] = {
                ...this.moods[index],
                mood: this.selectedMood,
                note: note,
                timestamp: new Date().toISOString()
            };
            
            this.saveMoods();
            this.displayHistory();
            this.updateStats();
            this.updateChart();
            this.closeModal();
            
            this.showNotification('Entrée mise à jour avec succès !', 'success');
        }
    }

    deleteMood(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
            this.moods = this.moods.filter(m => m.id !== id);
            this.saveMoods();
            this.displayHistory();
            this.updateStats();
            this.updateChart();
            this.checkTodayEntry();
            
            this.showNotification('Entrée supprimée avec succès', 'success');
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingEntry = null;
        this.selectedMood = null;
    }

    filterHistory(period) {
        let filteredMoods = this.moods;
        
        if (period !== 'all') {
            const days = parseInt(period);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            filteredMoods = this.moods.filter(mood => 
                new Date(mood.date) >= cutoffDate
            );
        }
        
        this.displayHistory(filteredMoods);
    }

    updateStats() {
        // Total de jours
        document.getElementById('totalDays').textContent = this.moods.length;
        
        // Série actuelle
        const streak = this.calculateStreak();
        document.getElementById('currentStreak').textContent = streak;
        
        // Humeur moyenne
        const avgMood = this.calculateAverageMood();
        document.getElementById('avgMood').textContent = avgMood;
    }

    calculateStreak() {
        if (this.moods.length === 0) return 0;
        
        const sortedMoods = [...this.moods].sort((a, b) => new Date(b.date) - new Date(a.date));
        let streak = 0;
        let currentDate = new Date();
        
        for (let mood of sortedMoods) {
            const moodDate = new Date(mood.date);
            const diffDays = Math.floor((currentDate - moodDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak) {
                streak++;
                currentDate = new Date(moodDate);
            } else {
                break;
            }
        }
        
        return streak;
    }

    calculateAverageMood() {
        if (this.moods.length === 0) return '-';
        
        const totalValue = this.moods.reduce((sum, mood) => sum + mood.mood.value, 0);
        const average = totalValue / this.moods.length;
        
                        // Convertir en emoji
        if (average >= 4.5) return '😊';
        if (average >= 3.5) return '🙂';
        if (average >= 2.5) return '😐';
        if (average >= 1.5) return '😢';
        if (average >= 0.5) return '😡';
        return '😴';
    }

    initChart() {
        const ctx = document.getElementById('moodChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Humeur',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const moodLabels = {
                                    0: '😴 Fatigué',
                                    1: '😡 Énervé',
                                    2: '😢 Triste',
                                    3: '😐 Neutre',
                                    4: '🙂 Heureux',
                                    5: '😊 Très heureux'
                                };
                                return moodLabels[value] || value;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const moodEmojis = {
                                    0: '😴',
                                    1: '😡',
                                    2: '😢',
                                    3: '😐',
                                    4: '🙂',
                                    5: '😊'
                                };
                                return moodEmojis[value] || value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        this.updateChart();
    }

    updateChart(period = '30') {
        if (!this.chart) return;
        
        let dateRange = [];
        
        if (period === 'all') {
            // Toutes les données
            if (this.moods.length === 0) {
                dateRange = [];
            } else {
                const earliestDate = new Date(Math.min(...this.moods.map(m => new Date(m.date))));
                const today = new Date();
                const daysDiff = Math.ceil((today - earliestDate) / (1000 * 60 * 60 * 24));
                
                for (let i = daysDiff; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    dateRange.push(date.toISOString().split('T')[0]);
                }
            }
        } else {
            // Période spécifique (7 ou 30 jours)
            const days = parseInt(period);
            const today = new Date();
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                dateRange.push(date.toISOString().split('T')[0]);
            }
        }
        
        // Préparer les données
        const chartData = dateRange.map(date => {
            const mood = this.moods.find(m => m.date === date);
            return mood ? mood.mood.value : null;
        });
        
        // Formater les labels
        const labels = dateRange.map(date => {
            const d = new Date(date);
            if (period === 'all' && dateRange.length > 60) {
                return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            }
            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = chartData;
        this.chart.update();
    }

    checkTodayEntry() {
        const today = new Date().toISOString().split('T')[0];
        const hasTodayEntry = this.moods.find(mood => mood.date === today);
        
        const saveButton = document.getElementById('saveMood');
        if (hasTodayEntry) {
            saveButton.textContent = 'Déjà enregistré aujourd\'hui';
            saveButton.disabled = true;
            saveButton.style.opacity = '0.6';
        } else {
            saveButton.textContent = 'Enregistrer mon humeur';
            saveButton.disabled = false;
            saveButton.style.opacity = '1';
        }
    }

    showNotification(message, type = 'info') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Ajouter les styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        // Couleurs selon le type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialiser l'application
let moodTracker;
document.addEventListener('DOMContentLoaded', () => {
    moodTracker = new MoodTracker();
});
