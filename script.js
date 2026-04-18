// رابط جلب البيانات من Vercel API الداخلي
const SHEET_API_URL = "/api/projects";

// رابط التليجرام الخاص بك
const telegramBotUrl = "https://t.me/DomaDesignsbot";

let lastProjectsData = ""; // لمقارنة البيانات ومنع التقطيع

// عرض المواقع في الصفحة
async function fetchAndRenderProjects() {
    const projectGrid = document.getElementById('projectGrid');

    try {
        const response = await fetch(SHEET_API_URL);
        const projects = await response.json();
        
        // تحويل البيانات لنص لمقارنتها بسرعة
        const currentDataString = JSON.stringify(projects);
        
        // إذا لم تتغير البيانات، لا نفعل شيئاً (منع التقطيع)
        if (currentDataString === lastProjectsData) return;
        
        lastProjectsData = currentDataString;
        projectGrid.innerHTML = ''; // مسح القديم فقط عند وجود جديد

        if (projects.length === 0) {
            projectGrid.innerHTML = '<p>لا توجد مواقع معروضة حالياً.</p>';
            return;
        }

        projects.forEach(project => {
            const card = `
                <div class="project-card">
                    <div class="card-thumb" style="background-image: url('${project.thumbnail}');">
                        <div class="price-tag">${project.price}</div>
                    </div>
                    <div class="card-info">
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <div class="card-actions">
                            <button class="btn preview-btn" onclick="openPreview('${project.previewUrl}')">تجربة حية</button>
                            <a href="${telegramBotUrl}?start=buy_${project.id}" target="_blank" class="btn buy-btn">شراء الآن</a>
                        </div>
                    </div>
                </div>
            `;
            projectGrid.innerHTML += card;
        });

        initScrollReveal();

    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

// تشغيل تأثيرات التمرير
function initScrollReveal() {
    const cards = document.querySelectorAll('.project-card');
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;
        cards.forEach(card => {
            const cardTop = card.getBoundingClientRect().top;
            if (cardTop < triggerBottom) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    };
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
}

// Open Preview Modal
// فتح المعاينة في نافذة جديدة مباشرة لتجنب حظر المواقع
function openPreview(url) {
    if (url === "#" || !url) {
        alert("معذرة، لا يوجد رابط معاينة متاح لهذا العمل.");
        return;
    }
    // فتح الرابط في نافذة جديدة
    window.open(url, '_blank');
}

// Close Preview Modal
function closePreview() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    modal.style.display = 'none';
    iframe.src = '';
    document.body.style.overflow = 'auto';
}

window.onclick = function(event) {
    const modal = document.getElementById('previewModal');
    if (event.target == modal) {
        closePreview();
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderProjects();
    // تحديث فوري كل ثانية واحدة (Real-time)
    setInterval(fetchAndRenderProjects, 1000);
});
