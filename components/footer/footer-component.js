// Footer Section - Componente Isolado
// Contém inicialização específica do footer

// Inicializa o footer quando carregado
function initFooterSection() {
    // Recria ícones Lucide no footer
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Inicializa quando a página carrega
document.addEventListener('DOMContentLoaded', initFooterSection);

// Também inicializa quando o HTML é carregado dinamicamente
window.addEventListener('loadFooterSection', initFooterSection);
