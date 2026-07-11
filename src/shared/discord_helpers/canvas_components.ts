import { CanvasRenderingContext2D, Canvas, Image } from 'canvas';

/**
 *
 * @param ctx Canvas Context
 * @param text テキスト
 * @param font_style フォントスタイル
 * @param fill_color 塗りつぶしの色
 * @param stroke_color フチの色
 * @param strokeWidth フチの太さ
 * @param x x座標
 * @param y y座標
 */
export function fillTextWithStroke(
    ctx: CanvasRenderingContext2D,
    text: string,
    font_style: string,
    fill_color: string,
    stroke_color: string,
    strokeWidth: number,
    x: number,
    y: number,
) {
    ctx.font = font_style;
    ctx.fillStyle = fill_color;
    ctx.fillText(text, x, y);
    ctx.strokeStyle = stroke_color;
    ctx.lineWidth = strokeWidth;
    ctx.strokeText(text, x, y);
}
/**
 * 角が丸い四角形を作成
 * @param ctx Canvas Context
 * @param x x座標
 * @param y y座標
 * @param width 幅
 * @param height 高さ
 * @param radius 角の半径サイズ
 */
export function createRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * 座標の位置に円形にクリップされた画像を表示
 * @param ctx Canvas Context
 * @param img 描写する画像
 * @param xPosition x座標
 * @param yPosition y座標
 * @param radius 半径
 */
export function drawArcImage(
    ctx: CanvasRenderingContext2D,
    img: Canvas | Image,
    xPosition: number,
    yPosition: number,
    radius: number,
) {
    ctx.beginPath();
    ctx.arc(xPosition + radius, yPosition + radius, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, img.width, img.height, xPosition, yPosition, radius * 2, radius * 2);
}
