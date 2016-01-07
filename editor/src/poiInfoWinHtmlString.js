/*******************************************************************************
 * Copyright (c) 2015 Daisuke Sato, dsato@jp.ibm.com
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
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ******************************************************************************/

var _poiInfoWinHtmlString = '<fieldset>'
+'<label for="poi-info-name">$(Name): </label><input id="poi-info-name" type="text"><br>'
+'<label for="poi-info-description">$(Description): </label><br><textarea id="poi-info-description" rows="3", cols="40"></textarea><br>'
+'$(Coordination on the edge) <br>'
+'$(Edge): <input type="text" id="poi-info-edge" disabled size="5"> - '
+'(<input type="text" id="poi-info-x" size="5">, <input type="text" id="poi-info-y" size="5">)<br>'
+'<hr>'
+'<label for="poi-info-optional">$(Use optional settings)</label><input type="checkbox" id="poi-info-optional">'
+'<div id="poi-info-optional-settings">'
+'<label for="poi-info-forward">$(Use when coming from node) <span id="poi-info-from-node1-id"></span></label><input id="poi-info-forward" type="checkbox" checked><br>'
+'<label for="poi-info-backward">$(Use when coming from node) <span id="poi-info-from-node2-id"></span></label><input id="poi-info-backward" type="checkbox" checked><br>'
+'</div>'
+'<hr>'
+'<button id="poi-info-delete" class="rightbutton">$(Delete)</button>'
+'';
