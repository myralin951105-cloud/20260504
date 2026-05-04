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
  // 繪製影像
  image(capture, 0, 0, w, h);

  // 如果有偵測到臉部，繪製指定的線條
  if (predictions.length > 0) {
    let keypoints = predictions[0].scaledMesh;
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
  }
  pop();
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
  capture.size(windowWidth * 0.5, windowHeight * 0.5);
}
