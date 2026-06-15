/* ── Loader ── */
(function() {
  var bar = document.getElementById('loader-bar');
  var percent = document.getElementById('loader-percent');
  var loader = document.getElementById('loader');
  var progress = 0;
  var fadeOut = false;

  function step() {
    if (fadeOut) return;
    var increment = progress < 30 ? 3 : progress < 70 ? 1.5 : 0.6;
    progress = Math.min(progress + increment * Math.random(), 98);
    bar.style.width = progress + '%';
    percent.textContent = 'LOADING... ' + Math.floor(progress) + '%';
    if (progress < 98) {
      setTimeout(step, 60 + Math.random() * 80);
    }
  }

  function finish() {
    fadeOut = true;
    progress = 100;
    bar.style.width = '100%';
    percent.textContent = 'READY';
    setTimeout(function() {
      loader.classList.add('is-hidden');
    }, 400);
  }

  step();

  window.addEventListener('load', function() {
    setTimeout(finish, 200);
  });
})();

// 禁用浏览器自动滚动恢复
history.scrollRestoration = 'manual';

// 保存和恢复滚动位置
const SCROLL_KEY = 'portfolioScrollPosition';
let isRestoringScroll = false;
let saveScrollRafId = null;
let canPersistScroll = false;
let hasRestoredOnce = false;

function saveScrollPosition() {
  if (!canPersistScroll || isRestoringScroll) return;
  localStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
}

function scheduleSaveScrollPosition() {
  if (!canPersistScroll || isRestoringScroll) return;
  if (saveScrollRafId) return;
  saveScrollRafId = requestAnimationFrame(() => {
    saveScrollRafId = null;
    saveScrollPosition();
  });
}

function restoreScrollPosition() {
  if (hasRestoredOnce) return;
  hasRestoredOnce = true;

  const savedScrollPos = localStorage.getItem(SCROLL_KEY);
  if (!savedScrollPos) {
    canPersistScroll = true;
    return;
  }

  const targetY = Number.parseInt(savedScrollPos, 10);
  if (!Number.isFinite(targetY) || targetY < 0) {
    canPersistScroll = true;
    return;
  }

  isRestoringScroll = true;
  window.scrollTo(0, targetY);

  // 在布局稳定后再次对齐，避免首屏动画/图片加载干扰恢复
  requestAnimationFrame(() => {
    window.scrollTo(0, targetY);
    setTimeout(() => {
      window.scrollTo(0, targetY);
      isRestoringScroll = false;
      canPersistScroll = true;
    }, 140);
  });
}

window.addEventListener("scroll", scheduleSaveScrollPosition, { passive: true });
window.addEventListener("pagehide", saveScrollPosition);
window.addEventListener("beforeunload", saveScrollPosition);
window.addEventListener("load", restoreScrollPosition, { once: true });
window.addEventListener("pageshow", () => {
  if (!hasRestoredOnce) {
    restoreScrollPosition();
  } else {
    canPersistScroll = true;
  }
});

const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      // 添加轻微延迟使动画更有层次感
      setTimeout(() => {
        entry.target.classList.add("visible");
      }, 50);

      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.1, // 降低阈值使动画更早触发
    rootMargin: "0px 0px 5% 0px", // 调整根边距
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const parallaxNav = document.querySelector(".hero-big-nav");
const heroPhotoPanel = document.querySelector(".hero-photo-panel");
const introStack = document.querySelector(".intro-stack");
const heroSection = document.querySelector(".hero");

let parallaxRafId = null;
let heroPhotoShift = 0;
let heroPhotoTargetShift = 0;

function updateParallax() {
  parallaxRafId = null;

  if (reduceMotionQuery.matches) {
    if (parallaxNav) {
      parallaxNav.style.setProperty("--hero-nav-shift", "0px");
    }
    if (heroPhotoPanel) {
      heroPhotoPanel.style.setProperty("--hero-photo-shift", "0px");
    }
    return;
  }

  const viewportHeight = window.innerHeight || 1;

  if (parallaxNav) {
    const rect = parallaxNav.getBoundingClientRect();
    const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
    const navShift = Math.max(-18, Math.min(18, centerOffset * -0.045));
    parallaxNav.style.setProperty("--hero-nav-shift", `${navShift.toFixed(2)}px`);
  }

  if (heroPhotoPanel) {
    const stackRect = introStack ? introStack.getBoundingClientRect() : null;
    const heroHeight = heroSection ? heroSection.offsetHeight : viewportHeight;
    const coverDistance = stackRect ? Math.max(1, Math.min(viewportHeight, Math.max(1, stackRect.height - heroHeight))) : viewportHeight;
    const scrolledPastHero = stackRect ? Math.max(0, -stackRect.top) : 0;
    const coverProgress = Math.max(0, Math.min(1, scrolledPastHero / coverDistance));

    heroPhotoTargetShift = coverProgress * 84;
    heroPhotoShift += (heroPhotoTargetShift - heroPhotoShift) * 0.075;
    heroPhotoPanel.style.setProperty("--hero-photo-shift", `${heroPhotoShift.toFixed(2)}px`);

    if (Math.abs(heroPhotoTargetShift - heroPhotoShift) > 0.08) {
      scheduleParallaxUpdate();
    }
  }
}

function scheduleParallaxUpdate() {
  if (parallaxRafId) return;
  parallaxRafId = requestAnimationFrame(updateParallax);
}

if (parallaxNav) {
  window.addEventListener("scroll", scheduleParallaxUpdate, { passive: true });
  window.addEventListener("resize", scheduleParallaxUpdate);
  window.addEventListener("load", scheduleParallaxUpdate, { once: true });

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", scheduleParallaxUpdate);
  } else if (typeof reduceMotionQuery.addListener === "function") {
    reduceMotionQuery.addListener(scheduleParallaxUpdate);
  }

  scheduleParallaxUpdate();
}

// ===== Timeline Scroll Reveal Effect =====
const timelineElement = document.querySelector(".timeline-scroll-reveal");

if (timelineElement) {
  window.addEventListener("scroll", () => {
    // 获取timeline在视口中的位置信息
    const timelineRect = timelineElement.getBoundingClientRect();
    const timelineTop = timelineRect.top;
    const timelineBottom = timelineRect.bottom;
    const windowHeight = window.innerHeight;
    
    // 计算timeline从进入视口到完全离开视口的进度
    // 当timeline顶部进入视口时开始（progress = 0）
    // 当timeline底部离开视口时结束（progress = 100）
    const totalHeight = timelineRect.height + windowHeight;
    const progress = Math.max(0, Math.min(100, ((windowHeight - timelineTop) / totalHeight) * 100));
    
    // 更新线条高度
    const beforeElement = timelineElement.querySelector("::before") || timelineElement;
    timelineElement.style.setProperty("--timeline-progress", progress + "%");
    
    // 直接通过伪元素方式更新高度
    const pseudoHeight = (progress / 100) * timelineRect.height;
    timelineElement.style.setProperty("--pseudo-height", pseudoHeight + "px");
  });
  
  // 初始触发一次
  window.dispatchEvent(new Event("scroll"));
}

const filterButtons = document.querySelectorAll(".portfolio-filter");
const portfolioPanels = document.querySelectorAll(".portfolio-panel");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    portfolioPanels.forEach((panel) => {
      const isActive = panel.dataset.panel === target;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;

      if (isActive) {
        panel.querySelectorAll(".reveal").forEach(function (card) {
          card.classList.add("visible");
        });
        var grid = panel.querySelector(".portfolio-strip-grid");
        if (grid) renderStagger(grid);
      }
    });

    updateFocusFrame(button);
  });
});

/* ── TrueFocus filter hover effect ── */
const focusContainer = document.getElementById("filterFocus");
const focusFrame = focusContainer ? focusContainer.querySelector(".focus-frame") : null;

function updateFocusFrame(activeBtn) {
  if (!focusFrame || !focusContainer) return;
  const containerRect = focusContainer.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  const left = btnRect.left - containerRect.left;
  const top = btnRect.top - containerRect.top;
  focusFrame.style.left = left + "px";
  focusFrame.style.top = top + "px";
  focusFrame.style.width = btnRect.width + "px";
  focusFrame.style.height = btnRect.height + "px";
  focusFrame.style.opacity = "1";
}

function hideFocusFrame() {
  if (!focusFrame) return;
  focusFrame.style.opacity = "0";
}

if (focusContainer && focusFrame) {
  // Show frame on active button on load
  var initial = focusContainer.querySelector(".portfolio-filter.is-active") || filterButtons[0];
  if (initial) updateFocusFrame(initial);

  filterButtons.forEach(function (btn) {
    btn.addEventListener("mouseenter", function () {
      updateFocusFrame(btn);
      filterButtons.forEach(function (b) {
        b.style.filter = b === btn ? "blur(0px)" : "blur(4px)";
        b.style.transition = "filter 0.5s ease";
      });
    });
    btn.addEventListener("mouseleave", function () {
      hideFocusFrame();
      filterButtons.forEach(function (b) {
        b.style.filter = "blur(0px)";
      });
    });
  });

  window.addEventListener("resize", function () {
    hideFocusFrame();
  });
}

// Portfolio Strips
const detailOpenPositions = new WeakMap();

function pauseDetailVideo(detail) {
  if (!detail) return;
  const video = detail.querySelector("video");
  const player = detail.querySelector(".portfolio-detail-player");
  if (video && !video.paused) {
    video.pause();
  }
  if (player) {
    player.classList.remove("is-playing");
  }
}

/* ── Portfolio detail data ── */
var portfolioData = {
  "school-01": { index: "01", title: "大广赛创意广告", subtitle: "可画一分钟创意广告", coverClass: "cover-school-01", videoSrc: "./vedio/大广赛案例（可画一分钟创意广告）.mp4", isPortrait: false, info: [{ label: "时长", value: "请补充" }, { label: "参与部分", value: "请补充" }, { label: "项目介绍", value: "请补充" }] },
  "school-02": { index: "02", title: "长视频影评", subtitle: "长视频影评案例", coverClass: "cover-school-02", videoSrc: "./vedio/长视频影评案例.mp4", isPortrait: false, info: [{ label: "时长", value: "请补充" }, { label: "参与部分", value: "请补充" }, { label: "项目介绍", value: "请补充" }] },
  "school-03": { index: "03", title: "AE 人物混剪", subtitle: "个人兴趣剪辑", coverClass: "cover-school-03", videoSrc: "./vedio/AE个人兴趣剪辑（人物混剪）.mp4", isPortrait: false, info: [{ label: "时长", value: "请补充" }, { label: "参与部分", value: "请补充" }, { label: "项目介绍", value: "请补充" }] },
  "school-04": { index: "04", title: "可视化数据新闻", subtitle: "AE + PR 数据新闻视频案例", coverClass: "cover-school-04", videoSrc: "./vedio/可视化数据新闻视频案例（AE+PR）.mp4", isPortrait: false, info: [{ label: "时长", value: "请补充" }, { label: "参与部分", value: "请补充" }, { label: "项目介绍", value: "请补充" }] },
  "school-05": { index: "05", title: "野外实践拍摄", subtitle: "大学野外实践拍摄剪辑案例", coverClass: "cover-school-05", videoSrc: "./vedio/大学野外实践拍摄剪辑案例.mp4", isPortrait: false, info: [{ label: "时长", value: "请补充" }, { label: "参与部分", value: "请补充" }, { label: "项目介绍", value: "请补充" }] },
  "school-06": { index: "06", title: "音乐歌词视频排版", subtitle: "视频排版练习案例", coverClass: "cover-school-06", videoSrc: "./vedio/视频排版练习案例-音乐歌词视频.mp4", isPortrait: false, info: [{ label: "时长", value: "请补充" }, { label: "参与部分", value: "请补充" }, { label: "项目介绍", value: "请补充" }] },
  "internship-01": { index: "01", title: "【蔚来】萤光来护驾 一日店长上班记", subtitle: "拍摄使用firefly萤火虫接上猫猫店长，送到领养日活动现场。", coverClass: "cover-internship-01", videoSrc: "./vedio/宠物救助_3剪.mp4", isPortrait: true, info: [{ label: "时长", value: "02:30" }, { label: "参与部分", value: "负责视频的拍摄和剪辑" }, { label: "项目介绍", value: "快闪竖屏短视频，firefly萤火虫杭州官方将携手杭州领养日，在猫猫躺（自在）生活节举办之时拍摄一条官方小视频，一方面是传递firefly萤火虫宠物友好等功能，一方面意在为后续用户志愿者招募提供前宣素材，进行打样" }] },
  "internship-02": { index: "02", title: "蔚来旗下品牌「萤火虫」车机系统宣传项目", subtitle: "负责通过节奏与视觉包装（AE）优化强化传播效果。", coverClass: "cover-internship-02", videoSrc: "./vedio/318小猫视频-7剪.mp4", isPortrait: true, info: [{ label: "时长", value: "00:37" }, { label: "参与部分", value: "拍摄、剪辑（包含视频包装）" }, { label: "项目介绍", value: "乐队氛围环作为萤火虫车机里的一个特色小功能，本来就与猫咪密不可分，同可爱猫咪一起宣传这一功能。" }] },
  "internship-03": { index: "03", title: "「蔚来」ET-9新车色到店宣传视频", subtitle: "分店外拍，在汽车展台内拍摄新车色。", coverClass: "cover-internship-03", videoSrc: "./vedio/3.26ET9.mp4", isPortrait: false, info: [{ label: "时长", value: "01:21" }, { label: "参与部分", value: "拍摄、剪辑" }, { label: "项目介绍", value: "围绕新车色的特点，以流畅的节奏输出新车色的细节和大体展示。" }] },
  "internship-04": { index: "04", title: "「蔚来」新款ET6ES6上市宣传视频", subtitle: "尝试一镜到底和3d摄像头跟踪手法。", coverClass: "cover-internship-04", videoSrc: "./vedio/4.2新款ET6ES6上市-1剪.mp4", isPortrait: true, info: [{ label: "时长", value: "01:39" }, { label: "参与部分", value: "拍摄、剪辑" }, { label: "项目介绍", value: "利用一镜到底的运镜来流畅的展示新车型的卖点，并辅助在后期使用AE进行3D摄像头跟踪。" }] },
  "internship-05": { index: "05", title: "蔚来旗下品牌「萤火虫」“循迹倒车”功能情景剧展示", subtitle: "通过情景剧的视频类型来演绎，输出卖点。", coverClass: "cover-internship-05", videoSrc: "./vedio/循迹倒车-v7.mp4", isPortrait: true, info: [{ label: "时长", value: "01:07" }, { label: "参与部分", value: "拍摄、剪辑" }, { label: "项目介绍", value: "外出取景，并配合演员的来协调拍摄，辅助以AE包装的形式，以较为舒服的节奏输出卖点。" }] },
  "internship-06": { index: "06", title: "蔚来旗下品牌「乐道」新车型L80到店宣传视频", subtitle: "根据必提卖点，独立完成整个视频的拍摄剪辑。", coverClass: "cover-internship-06", videoSrc: "./vedio/L80到店视频-v4.mp4", isPortrait: false, info: [{ label: "时长", value: "00:47" }, { label: "参与部分", value: "拍摄、剪辑" }, { label: "项目介绍", value: "外出到店拍摄，根据必提卖点独立完成整个视频的拍摄，并优化节奏展示新车型。" }] }
};

var currentDetailId = null;

function closeDetail() {
  var detailEl = document.getElementById("portfolioDetail");
  if (!detailEl) return;
  pauseDetailVideo(detailEl);
  var player = detailEl.querySelector(".portfolio-detail-player");
  if (player) {
    var video = player.querySelector("video");
    if (video) {
      video.pause();
      video.innerHTML = "";
      video.src = "";
      if (video.parentNode) video.parentNode.removeChild(video);
    }
    player.classList.remove("is-playing");
    player.dataset.playerBound = "";
  }
  detailEl.classList.remove("is-active");

  var activePanel = document.querySelector(".portfolio-panel.is-active");
  setPortfolioSubPageMode(activePanel, false);

  var lastScroll = detailOpenPositions.get(detailEl);
  if (typeof lastScroll === "number") {
    smoothScrollTo(lastScroll, 700);
  }
  currentDetailId = null;
}

function renderDetailContent(targetId) {
  var data = portfolioData[targetId];
  if (!data) return;

  var detailEl = document.getElementById("portfolioDetail");
  if (!detailEl) return;

  // Update player
  var player = detailEl.querySelector(".portfolio-detail-player");
  // 彻底清理旧视频
  var oldVideo = player.querySelector("video");
  if (oldVideo) {
    oldVideo.pause();
    oldVideo.innerHTML = "";
    oldVideo.src = "";
    if (oldVideo.parentNode) oldVideo.parentNode.removeChild(oldVideo);
  }
  player.className = "portfolio-detail-player " + (data.coverClass || "");
  if (data.isPortrait) player.classList.add("is-portrait-video");
  if (data.videoSrc) {
    player.setAttribute("data-video-src", data.videoSrc);
  } else {
    player.removeAttribute("data-video-src");
  }
  // Reset play button visibility
  var playBtn = player.querySelector(".portfolio-video-play-button");
  if (playBtn) playBtn.style.display = data.videoSrc ? "" : "none";
  player.classList.remove("is-playing");
  player.dataset.playerBound = "";

  // Update body
  detailEl.querySelector(".project-index").textContent = data.index;
  detailEl.querySelector("#detailTitle").textContent = data.title;
  detailEl.querySelector("#detailSubtitle").textContent = data.subtitle;

  var infoContainer = detailEl.querySelector("#detailInfo");
  infoContainer.innerHTML = data.info.map(function (item) {
    return '<p><strong>' + item.label + '</strong> ' + item.value + '</p>';
  }).join("");

  // Lazy-load video
  if (data.videoSrc) {
    var video = ensurePlayerVideo(player);
    setupPlayerEvents(player, video);
  }
}

function setPortfolioSubPageMode(panel, active) {
  var toolbar = document.querySelector(".portfolio-toolbar");
  var heading = document.querySelector(".portfolio-heading");
  if (panel) panel.classList.toggle("detail-is-open", active);
  if (toolbar) toolbar.classList.toggle("detail-is-open", active);
  if (heading) heading.classList.toggle("detail-is-open", active);
}

function openPortfolioDetail(strip) {
  if (!strip) return;
  var targetId = strip.dataset.detailTarget;
  if (!portfolioData[targetId]) return;

  var panel = strip.closest(".portfolio-panel");
  var detailEl = document.getElementById("portfolioDetail");

  // Toggle: clicking the same card closes it
  if (currentDetailId === targetId && detailEl.classList.contains("is-active")) {
    closeDetail();
    return;
  }

  detailOpenPositions.set(detailEl, window.scrollY);
  currentDetailId = targetId;

  renderDetailContent(targetId);
  detailEl.classList.add("is-active");
  setPortfolioSubPageMode(panel, true);

  requestAnimationFrame(function () {
    var targetY = detailEl.getBoundingClientRect().top + window.scrollY - 80;
    smoothScrollTo(targetY, 320);
  });
}


function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ── Stagger 堆叠轮播 ── */

var staggerCenters = {}; // panelId → centerIndex

function renderStagger(grid) {
  var cards = Array.from(grid.children);
  if (!cards.length) return;
  var panel = grid.closest(".portfolio-panel");
  var panelId = panel ? panel.dataset.panel : "default";
  var center = staggerCenters[panelId] || 0;

  center = ((center % cards.length) + cards.length) % cards.length;
  staggerCenters[panelId] = center;

  // 仿 stagger-testimonials: cardWidth / 1.5 为步长
  var cardEl = cards[0];
  var cardWidth = (cardEl.offsetWidth > 0 ? cardEl.offsetWidth : 300);
  var stepX = cardWidth / 1.5;

  cards.forEach(function (card, i) {
    var rawDist = i - center;
    var len = cards.length;
    var dist = rawDist;
    if (Math.abs(rawDist + len) < Math.abs(dist)) dist = rawDist + len;
    if (Math.abs(rawDist - len) < Math.abs(dist)) dist = rawDist - len;

    card.setAttribute("data-stagger-pos", String(dist));

    if (Math.abs(dist) > 2) {
      card.style.transform = "";
      return;
    }

    var x = stepX * dist;
    var y = dist === 0 ? -30 : (Math.abs(dist) % 2 === 1 ? 8 : -8);
    var deg = dist === 0 ? 0 : ((Math.abs(dist) % 2 === 1 ? 2.5 : -2.5) * (dist > 0 ? 1 : -1));

    card.style.transform = "translate(-50%, -50%) translateX(" + Math.round(x) + "px) translateY(" + y + "px) rotate(" + deg + "deg)";
  });
}

// 窗口大小变化时刷新
var staggerResizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(staggerResizeTimer);
  staggerResizeTimer = setTimeout(function () {
    document.querySelectorAll(".portfolio-strip-grid").forEach(function (grid) {
      renderStagger(grid);
    });
  }, 200);
});

function staggerShift(grid, direction) {
  var panel = grid.closest(".portfolio-panel");
  var panelId = panel ? panel.dataset.panel : "default";
  var center = staggerCenters[panelId] || 0;
  staggerCenters[panelId] = center + direction;
  renderStagger(grid);
}

function staggerGoTo(grid, cardIndex) {
  var panel = grid.closest(".portfolio-panel");
  var panelId = panel ? panel.dataset.panel : "default";
  staggerCenters[panelId] = cardIndex;
  renderStagger(grid);
}

// 初始化
document.querySelectorAll(".portfolio-strip-grid").forEach(function (grid) {
  renderStagger(grid);
});

// 切换面板时重新渲染
portfolioPanels.forEach(function (panel) {
  var grid = panel.querySelector(".portfolio-strip-grid");
  if (!grid) return;
  // 用 MutationObserver 或直接在 filter handler 里调用
  renderStagger(grid);
});

// 滚动按钮 → 切换聚焦卡片
document.addEventListener("click", function (event) {
  var btn = event.target.closest(".portfolio-scroll-button");
  if (!btn) return;
  event.preventDefault();
  event.stopPropagation();

  var container = btn.closest(".portfolio-carousel-container");
  var grid = container ? container.querySelector(".portfolio-strip-grid") : null;
  if (!grid) return;

  var isNext = btn.classList.contains("next");
  staggerShift(grid, isNext ? 1 : -1);
});

// 点击卡片：侧边卡 → 聚焦 / 中间卡 → 打开详情
document.addEventListener("click", function (event) {
  var card = event.target.closest(".portfolio-strip");
  if (!card) return;
  // 忽略滚动按钮区域的点击
  if (event.target.closest(".portfolio-scroll-button")) return;

  var grid = card.closest(".portfolio-strip-grid");
  if (!grid) return;

  if (card.getAttribute("data-stagger-pos") === "0") {
    // 中间聚焦卡 → 打开详情
    openPortfolioDetail(card);
    return;
  }

  // 侧边卡 → 带到中间
  var cards = Array.from(grid.children);
  var index = cards.indexOf(card);
  if (index >= 0) staggerGoTo(grid, index);
});

function smoothScrollTo(targetY, duration = 800) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  if (Math.abs(diff) < 2) return;

  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = Math.min(timestamp - startTime, duration);
    const progress = easeOutCubic(elapsed / duration);
    window.scrollTo(0, startY + diff * progress);
    if (elapsed < duration) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}


const experienceButton = document.querySelector('.hero-actions .button.primary');
const projectsButton = document.querySelector('.hero-actions .button.secondary');
if (experienceButton && projectsButton) {
  projectsButton.addEventListener('mouseenter', () => {
    experienceButton.classList.add('is-mirror-secondary');
  });
  projectsButton.addEventListener('mouseleave', () => {
    experienceButton.classList.remove('is-mirror-secondary');
  });
}

document.addEventListener("click", function (event) {
  var button = event.target.closest(".portfolio-detail-close");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  closeDetail();
});


let designPreviewHost = null;
let designPreviewImage = null;
let hidePreviewTimer = null;
let isDesignPreviewOpen = false;
let hasBoundDesignPreviewCloseHandlers = false;

function ensureDesignPreviewHost() {
  if (designPreviewHost && designPreviewImage) {
    return;
  }

  designPreviewHost = document.createElement("div");
  designPreviewHost.className = "design-hover-preview";
  designPreviewImage = document.createElement("img");
  designPreviewImage.alt = "设计作品预览";
  designPreviewHost.appendChild(designPreviewImage);
  document.body.appendChild(designPreviewHost);
}

function showDesignPreview(sourceImage) {
  if (!sourceImage) return;

  ensureDesignPreviewHost();
  if (hidePreviewTimer) {
    clearTimeout(hidePreviewTimer);
    hidePreviewTimer = null;
  }

  const source = sourceImage.currentSrc || sourceImage.src;
  if (!source) return;

  const naturalWidth = sourceImage.naturalWidth || sourceImage.clientWidth || 1;
  const naturalHeight = sourceImage.naturalHeight || sourceImage.clientHeight || 1;
  const ratio = naturalWidth / naturalHeight;

  const viewportWidth = Math.max(320, window.innerWidth * 0.92);
  const viewportHeight = Math.max(240, window.innerHeight * 0.92);

  // 先按宽度铺开，不够高时保持宽度优先；过高时回退到高度适配。
  let targetWidth = viewportWidth;
  let targetHeight = targetWidth / ratio;
  if (targetHeight > viewportHeight) {
    targetHeight = viewportHeight;
    targetWidth = targetHeight * ratio;
  }

  designPreviewImage.src = source;
  designPreviewImage.alt = sourceImage.alt || "设计作品预览";
  designPreviewImage.dataset.source = source;
  designPreviewImage.style.width = `${Math.round(targetWidth)}px`;
  isDesignPreviewOpen = true;
  document.body.classList.add("design-hover-active");
}

function hideDesignPreview() {
  if (!designPreviewImage) {
    isDesignPreviewOpen = false;
    document.body.classList.remove("design-hover-active");
    return;
  }

  hidePreviewTimer = setTimeout(() => {
    isDesignPreviewOpen = false;
    document.body.classList.remove("design-hover-active");
  }, 30);
}

function bindDesignPreviewCloseHandlers() {
  if (hasBoundDesignPreviewCloseHandlers) return;
  hasBoundDesignPreviewCloseHandlers = true;

  document.addEventListener("click", (event) => {
    if (!isDesignPreviewOpen) return;
    if (event.target.closest(".design-item")) return;
    hideDesignPreview();
  });

  document.addEventListener("keydown", (event) => {
    if (!isDesignPreviewOpen) return;
    if (event.key === "Escape") {
      hideDesignPreview();
    }
  });
}

function initDesignCarouselAutoplay(wrapper) {
  const grid = wrapper.querySelector(".design-strip-grid");
  if (!grid) return;

  const originalItems = Array.from(grid.children);
  if (!originalItems.length) return;

  if (!grid.dataset.loopReady) {
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      grid.appendChild(clone);
    });
    grid.dataset.loopReady = "true";
  }

  const baseSpeed = 0.7;
  let currentSpeed = baseSpeed;
  let frameId = null;
  bindDesignPreviewCloseHandlers();

  wrapper.querySelectorAll(".design-item").forEach((item) => {
    const image = item.querySelector("img");
    if (!image) return;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const source = image.currentSrc || image.src;
      const isSameImageOpen =
        isDesignPreviewOpen &&
        designPreviewImage &&
        designPreviewImage.dataset.source === source;

      if (isSameImageOpen) {
        hideDesignPreview();
        return;
      }

      showDesignPreview(image);
    });
  });

  const animate = () => {
    const loopWidth = grid.scrollWidth / 2;
    const targetSpeed = isDesignPreviewOpen ? 0 : baseSpeed;
    currentSpeed += (targetSpeed - currentSpeed) * 0.08;

    if (wrapper.clientWidth > 0 && loopWidth > wrapper.clientWidth) {
      wrapper.scrollLeft += currentSpeed;

      if (wrapper.scrollLeft >= loopWidth) {
        wrapper.scrollLeft -= loopWidth;
      }
    }

    frameId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
  };
}

const designCarouselWrappers = document.querySelectorAll(".design-carousel-wrapper");
designCarouselWrappers.forEach((wrapper) => {
  initDesignCarouselAutoplay(wrapper);
});


function ensurePlayerVideo(player) {
  if (player.querySelector("video")) return player.querySelector("video");

  var src = player.getAttribute("data-video-src");
  if (!src) return null;

  var video = document.createElement("video");
  video.className = "portfolio-detail-video";
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;

  var source = document.createElement("source");
  source.src = src;
  source.type = "video/mp4";
  video.appendChild(source);

  var button = player.querySelector(".portfolio-video-play-button");
  if (button) {
    player.insertBefore(video, button);
  } else {
    player.appendChild(video);
  }

  return video;
}

function setupPlayerEvents(player, video) {
  if (!video) return;
  var button = player.querySelector(".portfolio-video-play-button");
  if (!button) return;
  if (player.dataset.playerBound === "true") return;
  player.dataset.playerBound = "true";

  var syncState = function () {
    player.classList.toggle("is-playing", !video.paused && !video.ended);
    video.controls = !(video.paused && (video.currentTime <= 0.05 || video.ended));
  };

  button.addEventListener("click", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await video.play();
    } catch (error) {
      console.warn("Video play was interrupted.", error);
    }
    syncState();
  });

  video.addEventListener("play", syncState);
  video.addEventListener("pause", syncState);
  video.addEventListener("ended", syncState);
  syncState();
}

function initPortfolioVideoPlayers() {
  var players = document.querySelectorAll(".portfolio-detail-player");
  players.forEach(function (player) {
    var video = player.querySelector("video");
    if (video) {
      setupPlayerEvents(player, video);
    }
  });
}

initPortfolioVideoPlayers();

/* ── GSAP Scroll tighten effect ── */
gsap.registerPlugin(ScrollTrigger);

// 移动端 ScrollTrigger 修复
ScrollTrigger.config({ ignoreMobileResize: true });

// 页面完全加载后刷新所有 ScrollTrigger
window.addEventListener('load', () => {
  setTimeout(() => {
    ScrollTrigger.refresh(true);
  }, 300);
});

// 移动端横竖屏切换时重新计算
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    ScrollTrigger.refresh(true);
  }, 500);
});

function initExpAnimation() {
  ScrollTrigger.getAll()
    .filter(t => t.vars.id && t.vars.id.startsWith('exp-'))
    .forEach(t => t.kill());

  // 正文动画
  document.querySelectorAll('#experience .exp-body').forEach((p, pi) => {
    const text = p.dataset.original || p.textContent.trim();
    p.dataset.original = text;
    const containerWidth = p.getBoundingClientRect().width;

    p.innerHTML = [...text].map(c =>
      `<span style="display:inline;">${c === ' ' ? ' ' : c}</span>`
    ).join('');

    const spans = [...p.querySelectorAll('span')];
    const lineMap = new Map();
    spans.forEach(span => {
      const top = Math.round(span.getBoundingClientRect().top);
      if (!lineMap.has(top)) lineMap.set(top, []);
      lineMap.get(top).push(span.textContent);
    });

    const lines = [...lineMap.values()].map(chars => chars.join(''));
    p.innerHTML = '';

    lines.forEach((lineText, i) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'exp-line';
      lineDiv.textContent = lineText;
      lineDiv.style.cssText = `display:block;white-space:nowrap;overflow:hidden;width:${containerWidth}px;max-width:${containerWidth}px;`;
      p.appendChild(lineDiv);

      gsap.fromTo(lineDiv,
        { letterSpacing: '0.2em', opacity: 0 },
        {
          letterSpacing: '0em',
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            id: `exp-body-${pi}-${i}`,
            trigger: p,
            start: `top+=${i * 40} 95%`,
            end: `top+=${i * 40 + 120} 60%`,
            scrub: 1,
          }
        }
      );
    });
  });

  // 标题动画
  document.querySelectorAll('#experience .exp-title').forEach((h3, hi) => {
    const text = h3.dataset.original || h3.textContent.trim();
    h3.dataset.original = text;
    const containerWidth = h3.getBoundingClientRect().width;

    h3.innerHTML = [...text].map(c =>
      `<span style="display:inline;">${c === ' ' ? ' ' : c}</span>`
    ).join('');

    const spans = [...h3.querySelectorAll('span')];
    const lineMap = new Map();
    spans.forEach(span => {
      const top = Math.round(span.getBoundingClientRect().top);
      if (!lineMap.has(top)) lineMap.set(top, []);
      lineMap.get(top).push(span.textContent);
    });

    const lines = [...lineMap.values()].map(chars => chars.join(''));
    h3.innerHTML = '';

    lines.forEach((lineText, i) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'exp-title-line';
      lineDiv.textContent = lineText;
      lineDiv.style.cssText = `display:block;white-space:nowrap;overflow:hidden;width:${containerWidth}px;max-width:${containerWidth}px;`;
      h3.appendChild(lineDiv);

      gsap.fromTo(lineDiv,
        { letterSpacing: '0.15em', opacity: 0 },
        {
          letterSpacing: '-0.02em',
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            id: `exp-title-${hi}-${i}`,
            trigger: h3,
            start: `top+=${i * 30} 90%`,
            end: `top+=${i * 30 + 100} 55%`,
            scrub: 1,
          }
        }
      );
    });
  });
}

window.addEventListener('load', initExpAnimation);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initExpAnimation();
    ScrollTrigger.refresh();
  }, 300);
});

/* ── Heading horizontal scroll animation ── */
window.addEventListener('load', () => {
  const expList = document.querySelector('.exp-list');
  const expHeading = document.querySelector('.exp-heading');
  const listLeft = expList.getBoundingClientRect().left;
  const headingLeft = expHeading.getBoundingClientRect().left;
  const offset = listLeft - headingLeft;

  gsap.fromTo(expHeading,
    { x: window.innerWidth },
    {
      x: offset,
      ease: 'none',
      scrollTrigger: {
        trigger: '.exp-heading',
        start: 'top 120%',
        end: 'center center',
        scrub: 0.5,
      }
    }
  );
});

/* ── Tag cloud marquee ── */
(function() {
  var track = document.querySelector('.tag-track');
  var tags = track.querySelectorAll('span');
  tags.forEach(function(tag) {
    track.appendChild(tag.cloneNode(true));
  });
})();

/* ── Metrics card slide-in ── */
gsap.utils.toArray('.metrics-section .metric-card').forEach(function(card, i) {
  gsap.fromTo(card,
    { x: 120, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      ease: 'power2.out',
      duration: 0.7,
      delay: i * 0.15,
      scrollTrigger: {
        trigger: '.metrics-section',
        start: 'top 80%',
      }
    }
  );
});

/* ── Portfolio video player setup ── */
document.querySelectorAll('.portfolio-detail-player-inner').forEach(function(player) {
  var btn = document.createElement('button');
  btn.className = 'fullscreen-btn';
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  player.appendChild(btn);

  var video = player.querySelector('video');
  if (!video) return;

  btn.addEventListener('click', function() {
    if (!document.fullscreenElement) {
      player.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  video.addEventListener('click', function() {
    if (video.paused) video.play();
    else video.pause();
  });

  // 检测竖屏视频并标记
  function markPortrait() {
    var vw = video.videoWidth;
    var vh = video.videoHeight;
    if (vw && vh && vh > vw) {
      player.closest('.portfolio-detail-player').classList.add('is-portrait-video');
    }
  }
  if (video.readyState >= 1) {
    markPortrait();
  } else {
    video.addEventListener('loadedmetadata', markPortrait);
  }
});

