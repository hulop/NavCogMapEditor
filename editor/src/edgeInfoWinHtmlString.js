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
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ******************************************************************************/

var _edgeInfoWinHtmlString = '<fieldset>'
		+ '<legend>$(Edge Information)</legend>'
		+ '$(ID): <input type="text" id="edge-info-id" style="width:30px" disabled>'
		+ '&#160;&#160;$(Length): <input type="text" id="edge-info-len" value="0" style="width:30px" disabled> (<span id="edge-info-unit"></span>)'
		+ '&#160;&#160;$(Orientation): <input type="text" id="edge-info-ori" value="90" style="width:30px"> (&#176)'
		+ '<hr>'
		+ '$(Start From): (<input type="text" id="edge-info-start-x" value="0" style="width:30px">, <input type="text" id="edge-info-start-y" value="0" style="width:30px">) $(To End) :( <input type="text" id="edge-info-end-x" value="0" style="width:30px">, <input type="text" id="edge-info-end-y" value="0" style="width:30px">)<br>'
		+ '<hr>'
		+ '<label for="edge-info-json">$(JSON): </label><input id="edge-info-json" style="width:298px" type="text"><br>'
		+ '<hr>'
		+ '<div id="edge-info-basic">'
		+ '$(Min KnnDist): <input type="text" id="edge-info-min-knndist" style="width:57px">, $(Max KnnDist): <input type="text" id="edge-info-max-knndist" style="width:57px">'
		+ '<hr>'
		+ '$(Data File): <input type="text" id="edge-info-data-file-name" style="width:220px" disabled><br>'
		+ '<input type="file" id="edge-info-data-file-chooser"><br>'
		+ '</div><div id="edge-info-advanced">'
		+ '$(Localization): <select id="edge-info-localization"></select><br>'
		+ '<span class="hidden">$(Floor): <select id="edge-info-localization-floor"></select><br></span>'
		+ '<span class="hidden">$(2D Navigation): <input type="checkbox" id="edge-info-2d-navigation-flag"><br></span>'
		+ '</div>'
		+ '<hr>'
		+ '$(Info needed when coming from node) <input type="text" id="edge-info-nodeid1" disabled style="width:35px">:<br>'
		+ '<textarea id="edge-info-info-from-node1" rows="3" cols="44" style="resize:none"></textarea><br>'
		+ '$(Info needed when coming from node) <input type="text" id="edge-info-nodeid2" disabled style="width:35px">:<br>'
		+ '<textarea id="edge-info-info-from-node2" rows="3" cols="44" style="resize:none"></textarea><br>'
		+ '<br>'
		+ '<button type="button" style="float:right" onclick="removeCurrentEdge()"> <- $(Delete) -> </button>'
		+ '</fieldset>';