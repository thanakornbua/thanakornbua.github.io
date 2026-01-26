document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    const icon = toggleButton.querySelector('i');

    // Function to set theme
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update icon
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    };

    // Initial check
    if (currentTheme) {
        setTheme(currentTheme);
    } else if (prefersDarkScheme.matches) {
        setTheme('dark');
    }

    // Toggle event listener
    toggleButton.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    });

    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        }
    });
});