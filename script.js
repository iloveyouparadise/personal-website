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
        panel.querySelectorAll(".reveal").forEach((card) => {
          card.classList.add("visible");
        });
        requestAnimationFrame(() => refreshPortfolioLoopMetrics(panel));
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
  "school-01": { index: "01", title: "毕业设计", subtitle: "建议放你最完整的一项学校作品，作为作品集的首页项目。", coverClass: "cover-school-01", videoSrc: null, isPortrait: false, info: [{ label: "时间", value: "请补充" }, { label: "参与部分", value: "视觉概念、内容策划、拍摄或剪辑流程" }, { label: "项目介绍", value: "这里可以写背景、目标、最终呈现方式和你最想强调的亮点。" }] },
  "school-02": { index: "02", title: "广告 / MV / 微电影", subtitle: "适合整理成一张代表你视频全流程制作能力的案例卡。", coverClass: "cover-school-02", videoSrc: null, isPortrait: false, info: [{ label: "时间", value: "请补充" }, { label: "参与部分", value: "拍摄、分镜、剪辑、节奏设计" }, { label: "项目介绍", value: "写清项目类型、合作方式、风格方向，以及你负责的核心环节。" }] },
  "school-03": { index: "03", title: "新媒体账号分析", subtitle: "适合展示你做内容研究、账号拆解和可视化表达的能力。", coverClass: "cover-school-03", videoSrc: null, isPortrait: false, info: [{ label: "时间", value: "请补充" }, { label: "参与部分", value: "调研、结构梳理、结论输出" }, { label: "项目介绍", value: "补充研究对象、分析维度、最后得出的策略结论。" }] },
  "school-04": { index: "04", title: "课程协作项目", subtitle: "适合用来说明你在团队合作里的职责和统筹能力。", coverClass: "cover-school-04", videoSrc: null, isPortrait: false, info: [{ label: "时间", value: "请补充" }, { label: "参与部分", value: "协作推进、物料整理、呈现把控" }, { label: "项目介绍", value: "强调你在团队中的具体贡献，而不是只写项目结果。" }] },
  "school-05": { index: "05", title: "研究型课程作品", subtitle: "适合强调方法、调研和系统性思考。", coverClass: "cover-school-05", videoSrc: null, isPortrait: false, info: [{ label: "时间", value: "请补充" }, { label: "参与部分", value: "研究、分析、方案推导" }, { label: "项目介绍", value: "写清问题、方法、结论，以及最后如何转化成具体方案。" }] },
  "school-06": { index: "06", title: "个人表达作品", subtitle: "适合作为这个分类里的收束项目，突出你的个人语言。", coverClass: "cover-school-06", videoSrc: null, isPortrait: false, info: [{ label: "时间", value: "请补充" }, { label: "参与部分", value: "概念、镜头、后期质感设计" }, { label: "项目介绍", value: "这里可以写你最喜欢这个作品的原因，以及希望观众看到什么。" }] },
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
  // Remove old video
  var oldVideo = player.querySelector("video");
  if (oldVideo) oldVideo.remove();
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

function bindPortfolioStripClicks(scope = document) {
  scope.querySelectorAll(".portfolio-strip").forEach((strip) => {
    if (strip.dataset.detailBound === "true") return;
    strip.dataset.detailBound = "true";
    strip.addEventListener("click", () => openPortfolioDetail(strip));
  });
}

bindPortfolioStripClicks();

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

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

const horizontalScrollAnimations = new WeakMap();

function animateHorizontalScroll(wrapper, targetX, duration = 250) {
  const clampedTarget = Math.max(0, targetX);
  const existing = horizontalScrollAnimations.get(wrapper);
  if (existing) {
    cancelAnimationFrame(existing);
  }

  const startX = wrapper.scrollLeft;
  const diff = clampedTarget - startX;
  if (Math.abs(diff) < 1) {
    wrapper.scrollLeft = clampedTarget;
    return;
  }

  let startTime = null;
  const step = (timestamp) => {
    if (startTime === null) startTime = timestamp;
    const elapsed = Math.min(timestamp - startTime, duration);
    const progress = easeOutCubic(elapsed / duration);
    wrapper.scrollLeft = startX + diff * progress;

    if (elapsed < duration) {
      const frameId = requestAnimationFrame(step);
      horizontalScrollAnimations.set(wrapper, frameId);
    } else {
      horizontalScrollAnimations.delete(wrapper);
    }
  };

  const frameId = requestAnimationFrame(step);
  horizontalScrollAnimations.set(wrapper, frameId);
}

function normalizePortfolioLoopPosition(wrapper) {
  const loopWidth = Number(wrapper.dataset.loopWidth || 0);
  if (!loopWidth) return;

  if (wrapper.scrollLeft < loopWidth) {
    wrapper.scrollLeft += loopWidth;
  } else if (wrapper.scrollLeft >= loopWidth * 2) {
    wrapper.scrollLeft -= loopWidth;
  }
}

function refreshPortfolioLoopMetrics(scope = document) {
  scope.querySelectorAll(".portfolio-carousel-wrapper").forEach((wrapper) => {
    const grid = wrapper.querySelector(".portfolio-strip-grid");
    if (!grid || grid.dataset.loopReady !== "true") return;
    const loopWidth = grid.scrollWidth / 3;
    if (!loopWidth) return;
    wrapper.dataset.loopWidth = String(loopWidth);
    if (!wrapper.dataset.loopPositioned) {
      wrapper.scrollLeft = loopWidth;
      wrapper.dataset.loopPositioned = "true";
    } else {
      normalizePortfolioLoopPosition(wrapper);
    }
  });
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

function initCarouselAutoplay(wrapper) {
  const grid = wrapper.querySelector(".portfolio-strip-grid");
  if (!grid) return;

  const originalItems = Array.from(grid.children);
  if (!originalItems.length) return;

  if (!grid.dataset.loopReady) {
    const prependFragment = document.createDocumentFragment();
    const appendFragment = document.createDocumentFragment();

    originalItems.forEach((item) => {
      const prependClone = item.cloneNode(true);
      prependClone.setAttribute("aria-hidden", "true");
      prependFragment.appendChild(prependClone);

      const appendClone = item.cloneNode(true);
      appendClone.setAttribute("aria-hidden", "true");
      appendFragment.appendChild(appendClone);
    });

    grid.prepend(prependFragment);
    grid.append(appendFragment);
    grid.dataset.loopReady = "true";
    bindPortfolioStripClicks(grid);
  }

  requestAnimationFrame(() => refreshPortfolioLoopMetrics(wrapper.parentElement || document));

  const baseSpeed = 0.6; // 更流畅的速度
  let currentSpeed = baseSpeed;
  let paused = false;
  let pauseCount = 0;

  const step = () => {
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
    const manualPauseUntil = Number(wrapper.dataset.manualPauseUntil || 0);
    const isManualPaused = Date.now() < manualPauseUntil;
    const target = paused || isManualPaused ? 0 : baseSpeed;
    currentSpeed += (target - currentSpeed) * 0.05; // 更平滑的缓动
    if (isManualPaused && Math.abs(currentSpeed) < 0.08) {
      currentSpeed = 0;
    }
    if (Math.abs(currentSpeed) < 0.01) currentSpeed = 0;

    if (maxScroll > 0 && currentSpeed > 0) {
      wrapper.scrollLeft += currentSpeed;
      normalizePortfolioLoopPosition(wrapper);
    }
  };

  const intervalId = setInterval(step, 20); // 更平滑的帧率

  // 只在卡片上悬停时暂停
  const strips = grid.querySelectorAll(".portfolio-strip");
  strips.forEach((strip) => {
    strip.addEventListener("mouseenter", () => {
      pauseCount++;
      paused = true;
    });
    strip.addEventListener("mouseleave", () => {
      pauseCount--;
      if (pauseCount <= 0) {
        pauseCount = 0;
        paused = false;
      }
    });
  });

  return () => clearInterval(intervalId);
}

const carouselWrappers = document.querySelectorAll(".portfolio-carousel-wrapper");
carouselWrappers.forEach((wrapper) => {
  initCarouselAutoplay(wrapper);
});
window.addEventListener("resize", () => refreshPortfolioLoopMetrics());

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


// 窗口完全加载后绑定按钮事件
window.addEventListener('load', () => {
  setTimeout(() => {
    bindScrollButtons();
  }, 100);
});

function bindScrollButtons() {
  // Portfolio Scroll Carousel
  const scrollButtons = document.querySelectorAll(".portfolio-scroll-button");

  const getStepSize = (wrapper, grid) => {
    const firstCard = grid ? grid.querySelector(".portfolio-strip") : null;
    if (!firstCard) return 240;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gapValue = grid ? parseFloat(getComputedStyle(grid).gap || "0") : 0;
    const gap = Number.isFinite(gapValue) ? gapValue : 0;
    const step = Math.round(cardWidth + gap);
    return step > 0 ? step : 240;
  };

  scrollButtons.forEach((button) => {
    if (button.dataset.scrollBound === "true") return;
    button.dataset.scrollBound = "true";

    button.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();

      const isNext = this.classList.contains("next");
      const container = this.closest(".portfolio-carousel-container");
      const wrapper = container ? container.querySelector(".portfolio-carousel-wrapper") : null;
      const grid = wrapper ? wrapper.querySelector(".portfolio-strip-grid") : null;

      if (!wrapper) return;

      normalizePortfolioLoopPosition(wrapper);

      // 按单张卡片宽度滚动，手感更自然
      const scrollAmount = getStepSize(wrapper, grid);
      const loopWidth = Number(wrapper.dataset.loopWidth || 0);
      if (loopWidth <= 1) return;
      const currentScroll = wrapper.scrollLeft;
      const newScroll = isNext ? currentScroll + scrollAmount : currentScroll - scrollAmount;

      // 手动点击后短暂停掉自动轮播，保证点击优先且响应稳定
      wrapper.dataset.manualPauseUntil = String(Date.now() + 320);
      animateHorizontalScroll(wrapper, newScroll, 250);
      setTimeout(() => normalizePortfolioLoopPosition(wrapper), 260);
    });
  });
}

bindScrollButtons();

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

function drawCoverFrame(video, canvas, targetRatio) {
  const sourceWidth = video.videoWidth || 1;
  const sourceHeight = video.videoHeight || 1;
  const sourceRatio = sourceWidth / sourceHeight;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  const context = canvas.getContext("2d");
  context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
}

function generateVideoThumbnail(videoSource, mediaElement) {
  return new Promise((resolve) => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.muted = true;
    probe.playsInline = true;
    probe.src = videoSource;

    const cleanup = () => {
      probe.removeAttribute("src");
      probe.load();
    };

    probe.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(probe.duration) ? probe.duration : 0;
      const safeDuration = duration > 0.4 ? duration : 1;
      const randomOffset = 0.16 + Math.random() * 0.56;
      probe.currentTime = Math.min(safeDuration * randomOffset, Math.max(0.1, safeDuration - 0.1));
    }, { once: true });

    probe.addEventListener("seeked", () => {
      const rect = mediaElement.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width || 320));
      const height = Math.max(200, Math.round(rect.height || 200));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      try {
        drawCoverFrame(probe, canvas, width / height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      } catch (error) {
        console.warn("Failed to draw thumbnail frame.", error);
        resolve(null);
      } finally {
        cleanup();
      }
    }, { once: true });

    probe.addEventListener("error", () => {
      cleanup();
      resolve(null);
    }, { once: true });
  });
}

async function initPortfolioStripVideoCovers() {
  var internshipStrips = document.querySelectorAll('.portfolio-strip[data-detail-target^="internship-"]');

  for (var i = 0; i < internshipStrips.length; i++) {
    var strip = internshipStrips[i];
    var targetId = strip.dataset.detailTarget;
    var media = strip.querySelector(".portfolio-strip-media");
    if (!media) continue;

    var data = portfolioData[targetId];
    var videoSource = data ? data.videoSrc : "";
    if (!videoSource) continue;

    try {
      var thumbnail = await generateVideoThumbnail(videoSource, media);
      if (thumbnail) {
        media.style.backgroundImage = "url(\"" + thumbnail + "\")";
      }
    } catch (error) {
      console.warn("Thumbnail generation failed for " + targetId + ".", error);
    }
  }
}

initPortfolioVideoPlayers();

window.addEventListener("load", () => {
  initPortfolioStripVideoCovers();
});

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

