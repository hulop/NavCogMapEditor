/*******************************************************************************
 * Copyright (c) 2015 Chengxiong Ruan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *******************************************************************************/
 
 function regionMove(step, dir) {
	if (_currentRegion != null) {
		var overlay = _regionOverlays[_currentRegion.name];
		var c = overlay.move({
			length: step,
			direction: dir
		});
		_currentRegion.lat = c.lat();
		_currentRegion.lng = c.lng();
		overlay.draw();
	}
}

function regionLeftLarge() {
	regionMove(_regionPosLargeStep, -90);
}

function regionUpLarge() {
	regionMove(_regionPosLargeStep, 0);
}

function regionRightLarge() {
	regionMove(_regionPosLargeStep, 90);
}

function regionDownLarge() {
	regionMove(_regionPosLargeStep, 180);
}

function regionLeftSmall() {
	regionMove(_regionPosSmallStep, -90);
}

function regionUpSmall() {
	regionMove(_regionPosSmallStep, 0);
}

function regionRightSmall() {
	regionMove(_regionPosSmallStep, 90);
}

function regionDownSmall() {
	regionMove(_regionPosSmallStep, 180);
}

function regionResize(step) {
	if (_currentRegion != null) {
		var overlay = _regionOverlays[_currentRegion.name];
		overlay.ppm += step;
		_currentRegion.ppm = overlay.ppm;
		overlay.draw();
	}
}

function regionSizeUpLarge() {
	regionResize(-_regionSizeLargeStep);
}

function regionSizeDownLarge() {
	regionResize(_regionSizeLargeStep);
}

function regionSizeUpSmall() {
	regionResize(-_regionSizeSmallStep);
}

function regionSizeDownSmall() {
	regionResize(_regionSizeSmallStep);
}

function regionRotate(step) {
	if (_currentRegion != null) {
		var overlay = _regionOverlays[_currentRegion.name];
		overlay.rotate += step;
		_currentRegion.rotate = overlay.rotate;
		overlay.draw();
	}
}

function regionCounterLarge() {
	regionRotate(-_regionRotateLargeStep);
}

function regionClockLarge() {
	regionRotate(_regionRotateLargeStep);
}

function regionCounterSmall() {
	regionRotate(-_regionRotateSmallStep);
}

function regionClockSmall() {
	regionRotate(_regionRotateSmallStep);
}