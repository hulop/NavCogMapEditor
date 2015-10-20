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

var _beaconInfoWinHtmlString = '<fieldset style="text-align:right">'
		+ '<legend>$(Beacon Information)</legend>'
		+ '$(UUID) : <input type="text" id="beacon-info-uuid"><br>'
		+ '$(Major ID) : <input type="text" id="beacon-info-major"><br>'
		+ '$(Minor ID) : <input type="text" id="beacon-info-minor"><br>'
		+ '$(Product ID) : <input type="text" id="beacon-info-product-id"><br>'
		+ '$(Beacon ID) : <input type="text" id="beacon-info-beacon-id" disabled><br>'
		+ '<br>'
		+ '<input type="checkbox" id="beacon-info-enable-poi"> $(Enable "POI" with Info): &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;<br>'
		+ '<textarea id="beacon-info-poi-info" rows="4" cols="30" style="resize:none"></textarea><br>'
		+ '<br>'
		+ '<button type="button" onclick="removeCurrentBeacon()"> <- $(Delete) -> </button>'
		+ '</fieldset>';
		