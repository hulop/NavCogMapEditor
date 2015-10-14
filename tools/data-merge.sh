# *******************************************************************************
# * Copyright (c) 2015 Chengxiong Ruan
# *
# * Permission is hereby granted, free of charge, to any person obtaining a copy
# * of this software and associated documentation files (the "Software"), to deal
# * in the Software without restriction, including without limitation the rights
# * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# * copies of the Software, and to permit persons to whom the Software is
# * furnished to do so, subject to the following conditions:
# *
# * The above copyright notice and this permission notice shall be included in
# * all copies or substantial portions of the Software.
# *
# * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# * THE SOFTWARE.
# *******************************************************************************/
#!/bin/sh

echo "concat $1 files"
mkdir $1-data
edges=`find $1 -name edge_*.txt | awk 'match($0, /edge_[0-9]+/) {print substr($0, RSTART, RLENGTH)}' | sort | uniq`

for edge in $edges
do
echo $edge
awk 'NR==1 || FNR!=1' `find $1 -name $edge*.txt` > $1-data/$edge.txt
done

#\ls $1_* | grep -v 0.0_0.0.txt | awk '{print "tail -n +2 "$1}' | sh > tmp &&  
#sort -k 2 -t , -n tmp > tmp1 && 
#cat $1_0.0_0.0.txt tmp1 > $1.txt && 
#rm tmp tmp1

