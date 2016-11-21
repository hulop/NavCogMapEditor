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

var _nodeInfoWinHtmlString = '<fieldset>'
		+ '<legend>$(Node Information)</legend>'
		+ '$(Type): '
		+ '<select id="node-info-type-chooser">'
		+ '<option value="Normal">$(Normal)</option>'
		+ '<option value="Door">$(Door)</option>'
		+ '<option value="Stair">$(Stair)</option>'
		+ '<option value="Elevator">$(Elevator)</option>'
		+ '<option value="Destination">$(Destination)</option>'
		+ '</select>'
		+ '&#160;&#160; $(Name): <input type="text" id="node-info-name" size="15"> &#160;&#160; $(ID) : <input type="text" id="node-info-id" style="width:30px; float:right" disabled><br>'
		+ '$(Building Name): <select id="node-info-building-chooser" style="width:134px"><option value="">$(None)</option></select> &#160;&#160; &#160;$(Floor)&#160;: <input type="text" id="node-info-floor" style="width:30px; float:right"> <br>'
		+ '<hr>'
		+ '$(Coordinates in Edge): </label>'
		+ '<select id="node-info-topo-edge-chooser"></select> : ( x = <input type="text" id="node-info-topox" style="width:30px" disabled>, y = <input type="text" id="node-info-topoy" style="width:30px" disabled> ),<br>'
		+ '$(and info needed when coming from this Edge) :<br>'
		+ '<textarea id="node-info-info-from-edge" rows="2" cols="47" style="resize:none"></textarea><br>'
		+ '$(Destination info when coming from this Edge) :<br>'
		+ '<textarea id="node-info-dest-info" rows="2" cols="47" style="resize:none"></textarea><br>'
		+ '<input type="checkbox" id="node-info-tricky-enable">$(Enable tricky node info from this edge) :<br>'
		+ '<textarea id="node-info-tricky-info" rows="2" cols="47" style="resize:none"></textarea>'
		+ '<hr>'
		+ '$(Transit to Layer): <select id="node-info-transit-layer-chooser"></select><br><br> '
		+ '<input type="checkbox" id="node-info-transit-enable"> $(Enable transit to Node): <select id="node-info-transit-node-chooser" style="width:80px"></select> $(with Info):<br>'
		+ '<textarea id="node-info-info-from-node" rows="4" cols="47" style="resize:none"></textarea><br>'
		+ '$(Using target kNN Dist): <input type="text" id="node-info-transit-knn-threshold" style="width:53.5px"> $(and Pos): <input type="text" id="node-info-transit-pos-threshold" style="width:53.5px"><br><br>'
		+ '<button type="button" style="float:right" onclick="removeCurrentNode()"> <- $(Delete) -> </button>'
		+ '</fieldset>'