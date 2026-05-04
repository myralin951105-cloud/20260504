let capture;
let faceMesh;
let predictions = [];
// 定義要串接的臉部節點編號
const lipIndices = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
// 定義第二組要串接的臉部節點編號
const extraPathIndices = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];
// 定義右眼外圈 (起始於 247)
const rightEyeOuter = [247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110];
// 定義右眼內圈 (起始於 246)
const rightEyeInner = [246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
// 定義左眼外圈 (對稱於右眼外圈)
const leftEyeOuter = [337, 256, 252, 253, 254, 255, 339, 286, 441, 463, 260, 259, 258, 257, 467, 342];
// 定義左眼內圈 (對稱於右眼內圈)
const leftEyeInner = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];
// 定義臉部外層輪廓的節點編號 (常用於 MediaPipe Facemesh 的臉部橢圓)
const faceContourIndices = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
  152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  // 設定影像大小為畫面的 50%
  capture.size(windowWidth * 0.5, windowHeight * 0.5);
  // 隱藏預設的 video 標籤，只在畫布上繪製
  capture.hide();

  // 安全檢查：確認 ml5 是否成功載入
  if (typeof ml5 === 'undefined') {
    alert("找不到 ml5 函式庫！請確認 index.html 是否正確引入 ml5.js");
    return;
  }

  // 初始化 Facemesh 模型
  faceMesh = ml5.facemesh(capture, () => console.log("Model Ready!"));
  // 當偵測到臉部時，更新 predictions 變數
  faceMesh.on("predict", (results) => {
    predictions = results;
  });
}

function draw() {
  background('#e7c6ff');

  let w = windowWidth * 0.5;
  let h = windowHeight * 0.5;
  let x = (windowWidth - w) / 2;
  let y = (windowHeight - h) / 2;

  push();
  // 移動座標系至影像右側邊界並進行水平縮放 (-1) 來達到左右顛倒效果
  translate(x + w, y);
  scale(-1, 1);

  // 如果有偵測到臉部，繪製指定的線條
  if (predictions.length > 0) {
    let keypoints = predictions[0].scaledMesh;

    // 1. 在影像顯示區域繪製黑色背景，這將覆蓋整個影像區域
    // 之後會用臉部輪廓來裁剪，只顯示臉部影像
    fill(0); // 黑色
    noStroke();
    rect(0, 0, w, h); // 繪製覆蓋整個影像區域的黑色矩形

    // 新增：在黑色背景上繪製白色星星 (外太空效果)
    push();
    randomSeed(99); // 固定隨機種子，讓星星不會閃爍跳動
    stroke(255);
    for (let i = 0; i < 100; i++) {
      strokeWeight(random(1, 3)); // 隨機星星大小
      point(random(w), random(h));
    }
    pop();

    // 2. 建立臉部輪廓的裁剪路徑
    drawingContext.save(); // 儲存當前的繪圖狀態
    drawingContext.beginPath();

    // 取得臉部輪廓的第一個點
    let firstPoint = keypoints[faceContourIndices[0]];
    if (firstPoint) {
      drawingContext.moveTo(firstPoint[0], firstPoint[1]);
    }

    // 連接臉部輪廓的其餘點
    for (let i = 1; i < faceContourIndices.length; i++) {
      let p = keypoints[faceContourIndices[i]];
      if (p) {
        drawingContext.lineTo(p[0], p[1]);
      }
    }
    drawingContext.closePath(); // 閉合輪廓
    drawingContext.clip(); // 應用裁剪路徑，只有路徑內的內容會被繪製

    // 3. 在裁剪區域內繪製攝影機影像
    image(capture, 0, 0, w, h);

    drawingContext.restore(); // 恢復繪圖狀態，移除裁剪路徑

    // 4. 在裁剪後的臉部影像上方繪製臉部特徵線條
    stroke(255, 0, 0); // 線條採用紅色
    strokeWeight(15);  // 粗細為 15
    noFill();

    // 利用 line 指令串接編號節點
    for (let i = 0; i < lipIndices.length - 1; i++) {
      let p1 = keypoints[lipIndices[i]];
      let p2 = keypoints[lipIndices[i + 1]];
      if (p1 && p2) {
        line(p1[0], p1[1], p2[0], p2[1]);
      }
    }

    // 繪製第二組指定的線條，線條顏色為紅色，粗細為 1
    strokeWeight(1);
    for (let i = 0; i < extraPathIndices.length - 1; i++) {
      let p1 = keypoints[extraPathIndices[i]];
      let p2 = keypoints[extraPathIndices[i + 1]];
      if (p1 && p2) {
        line(p1[0], p1[1], p2[0], p2[1]);
      }
    }

    // 繪製右眼外圈 (編號 247 開始)，紅色，粗細 2 (可自行調整)
    strokeWeight(2);
    noFill();
    beginShape();
    for (let index of rightEyeOuter) {
      let p = keypoints[index];
      if (p) {
        vertex(p[0], p[1]);
      }
    }
    endShape(CLOSE); // 自動連回起點 247

    // 繪製右眼內圈 (編號 246 開始)，紅色，粗細 2
    beginShape();
    for (let index of rightEyeInner) {
      let p = keypoints[index];
      if (p) {
        vertex(p[0], p[1]);
      }
    }
    endShape(CLOSE); // 自動連回起點 246

    // 繪製臉部最外層輪廓，線條採用紅色，粗細為 2
    strokeWeight(2);
    // 加入霓虹燈光暈效果
    drawingContext.shadowBlur = 20; // 模糊程度
    drawingContext.shadowColor = 'red'; // 光暈顏色

    for (let i = 0; i < faceContourIndices.length; i++) {
      let p1 = keypoints[faceContourIndices[i]];
      let p2 = keypoints[faceContourIndices[(i + 1) % faceContourIndices.length]];
      if (p1 && p2) {
        line(p1[0], p1[1], p2[0], p2[1]);
      }
    }
    drawingContext.shadowBlur = 0; // 重置光暈，避免影響其他線條
  } // 如果沒有偵測到臉部，則不會繪製黑色背景和影像，畫布將保持 e7c6ff 背景色
  pop();
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
  capture.size(windowWidth * 0.5, windowHeight * 0.5);
}
