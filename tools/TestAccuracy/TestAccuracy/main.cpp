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

#include <unordered_map>
#include <iostream>
#include <algorithm>
#include <dirent.h>
#include <string>
#include <opencv2/opencv.hpp>
#define MAX_LINE_LENGTH 1024
#define KNN_NUM 5
#define TREE_NUM 5
#define KEY_ERR_METER 3 //meter
#define FEET_PER_METER 3.28084

#define UNIT_3FEET 0.9144
#define UNIT_METER 1

using namespace std;


typedef struct _result {
    int edgeID;
    int testSmpNum;
	unordered_map<int, int> beaconsUsed;

    float aveDist = 0;
    float maxDist = -1;
    float minDist = INT_MAX;

    float avgErr = 0, maxErr = -1, minErr = 99999, worstX = 9999, worstY = 9999;

    int lessThan1 = 0;
    int lessThan2 = 0;
    int lessThan3 = 0;
    int lessThanKey = 0;

    float unit;
} Result;

void printResult(vector<Result> results);
Result* testAccuracy(const char *trainFilePath, const char *testFilePath, float unit);
int getDataNumOfFeatureFile(const char *path);
void filtData(cv::Mat &mat, int bulkSize);
Result* testAccuracySingleRun(int beaconNum, int trainSmpNum, int testSmpNum, FILE *fpTrain, FILE *fpTest, unordered_map<int, int> featureIdxMap, float unit);

int main(int argc, const char * argv[]) {

    if (argc < 2) {
        cerr << argv[0] << " [-3f][-m] <traing_dir> <test_dir>" << endl;
        cerr << endl;
        cerr << "-3f use 3 feet as unit" << endl;
        cerr << "-m use meter as unit" << endl;
        exit(0);
    }

    float unit = UNIT_3FEET;
    const char * train_dir = NULL;
    const char * test_dir = NULL;
    DIR *dir;

    for(int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-3f") == 0) {
            unit = UNIT_3FEET;
        }
        else if (strcmp(argv[i], "-m") == 0) {
            unit = UNIT_METER;
        }
        else if (train_dir == NULL) {
            if ((dir = opendir(argv[i])) == NULL) {
                cerr << argv[i] << " is not a directory" << endl;
                exit(0);
            }
            closedir(dir);
            train_dir = argv[i];
        }
        else {
            if ((dir = opendir(argv[i])) == NULL) {
                cerr << argv[i] << " is not a directory" << endl;
                exit(0);
            }
            closedir(dir);
            test_dir = argv[i];
        }
    }

    vector<Result> results;
    struct dirent *ent;
    if ((dir = opendir(train_dir)) != NULL) {
        while ((ent = readdir (dir)) != NULL) {
            if (strstr(ent->d_name, "edge") == ent->d_name) {
                char train[1024], test[1024];
                sprintf(train,"%s/%s",train_dir,ent->d_name);
                sprintf(test,"%s/%s",test_dir,ent->d_name);

                int edgeID;
                sscanf(ent->d_name, "edge_%d", &edgeID);
                vector<Result> partialResults = testAccuracy(train, test, unit, edgeID);
				results.insert(results.end(), partialResults.begin(), partialResults.end());
            }
        }
        closedir (dir);
    }
    printResult(results);

}

void printResultSingle(Result r) {
	cout << "{" << endl;
	cout << "  \"edgeID\" : " << r.edgeID << "," << endl;
	cout << "  \"testSmpNum\" : " << r.testSmpNum << "," << endl;
	cout << "  \"beacons\" : [" << endl;

    bool flag = 0;
    for(std::unordered_map<int, int>::iterator it = r.beaconsUsed.begin(); it != r.beaconsUsed.end(); ++it) {
        if (flag) {
            cout << "," << endl;
        }
		cout << it->first;

        flag = 1;
    }

    cout << endl << "]," << endl;
	cout << "  \"aveDist\" : " << r.aveDist << "," << endl;
	cout << "  \"aveDistNorm\" : " << (r.aveDist - r.minDist) / (r.maxDist - r.minDist) << "," << endl;
	cout << "  \"maxDist\" : " << r.maxDist << "," << endl;
	cout << "  \"minDist\" : " << r.minDist << "," << endl;

	cout << "  \"worstPos\" : {\"x\":" << r.worstX << ", \"y\":" << r.worstY << "}," << endl;
	cout << "  \"aveError\" : " << r.avgErr * 3 << "," << endl;
	cout << "  \"maxError\" : " << r.maxErr * 3 << "," << endl;
	cout << "  \"minError\" : " << r.minErr * 3 << "," << endl;
	cout << "  \"prob1U\" : " << (r.lessThan1 * 1.0 / r.testSmpNum) << "," << endl;
	cout << "  \"prob2U\" : " << (r.lessThan2 * 1.0 / r.testSmpNum) << "," << endl;
	cout << "  \"prob3U\" : " << (r.lessThan3 * 1.0 / r.testSmpNum) << "," << endl;
	cout << "}";
}

void printResult(vector<Result> v) {
    cout << "{" << endl;
    cout << "\"unit\": " << v[0].unit << "," << endl;
    cout << "\"results\": [" << endl;
    bool flag = 0;
    for(std::vector<Result>::iterator it = v.begin(); it != v.end(); ++it) {
        Result r = (Result)*it;
        if (flag) {
            cout << "," << endl;
        }
		printResultSingle(r);
        flag = 1;
    }

    cout << endl << "]," << endl;
    cout << "\"description\":{" << endl;
    cout << "  \"aveDist\":\"Average Distance\"," << endl;
    cout << "  \"aveDistNorm\":\"Normalized Average Distance\"," << endl;
    cout << "  \"maxDist\":\"Maximum Distance\"," << endl;
    cout << "  \"minDist\":\"Minimum Distance\"," << endl;
    cout << "  \"worstPos\":\"Worst Position\"," << endl;
    cout << "  \"aveError\":\"Average Error (feet)\"," << endl;
    cout << "  \"maxError\":\"Maximum Error (feet)\"," << endl;
    cout << "  \"minError\":\"Minimum Error (feet)\"," << endl;

    if (fabs(v[0].unit - UNIT_3FEET) < 10e-5) {
        cout << "  \"prob1U\":\"Probability of less than 3 feet ("<<  3 / FEET_PER_METER << " meter)\"," << endl;
        cout << "  \"prob2U\":\"Probability of less than 6 feet ("<<  6 / FEET_PER_METER << " meter)\"," << endl;
        cout << "  \"prob3U\":\"Probability of less than 9 feet ("<<  9 / FEET_PER_METER << " meter)\"" << endl;
    }
    if (fabs(v[0].unit - UNIT_METER) < 10e-5) {
        cout << "  \"prob1U\":\"Probability of less than 1 meter\"," << endl;
        cout << "  \"prob2U\":\"Probability of less than 2 meter\"," << endl;
        cout << "  \"prob3U\":\"Probability of less than 3 meter\"" << endl;

    }
    cout << "}" << endl;
    cout << "}" << endl;
}

vector<Result> testAccuracy(const char *trainFilePath, const char *testFilePath, float unit, int edgeID) {
    int testBeaconNum;
    int trainBeaconNum;
    int beaconNum;
    int testSmpNum;
    int trainSmpNum;

    trainSmpNum = getDataNumOfFeatureFile(trainFilePath);
    testSmpNum = getDataNumOfFeatureFile(testFilePath);

    FILE *fpTest = fopen(testFilePath, "r");
    FILE *fpTrain = fopen(trainFilePath, "r");

    // check Beacon Numbers
    fscanf(fpTest, "MinorID of %d Beacon Used : ", &testBeaconNum);
    fscanf(fpTrain, "MinorID of %d Beacon Used : ", &trainBeaconNum);
    if (testBeaconNum != trainBeaconNum) {
        cout << "Error : training data and testing data are using different beacons!" << endl;
        return NULL;
    }

    // check Beacon IDs
    // building hashmap mapping "minorID" -> "featureIndex"
    unordered_map<int, int> featureIdxMap;
    beaconNum = testBeaconNum;
    for (int i = 0; i < beaconNum; i++) {
        int testBeaconID;
        int trainBeaconID;
        fscanf(fpTest, "%d,", &testBeaconID);
        fscanf(fpTrain, "%d,", &trainBeaconID);
        if (testBeaconID != trainBeaconID) {
            cout << "Error : training data and testing data are using different beacons!" << endl;
            return NULL;
        }
        featureIdxMap[testBeaconID] = i;
    }

    //remember the current position
	fpos_t positionTrain;
    fpos_t positionTest;
	fgetpos(fpTrain, &positionTrain);
	fgetpos(fpTest, &positionTest);
	vector<Result> results;

	Result* result = testAccuracySingleRun(beaconNum, trainSmpNum, testSmpNum, fpTrain, fpTest, featureIdxMap, unit, edgeID);
	results.push_back(*result);

	if(featureIdxMap.size() > 1) {
		vector<Result> reducedResults = testAccuracyReduce(beaconNum, trainSmpNum, testSmpNum, fpTrain, fpTest, featureIdxMap, unit, positionTrain, positionTest, edgeID);
		results.insert(results.end(), reducedResults.begin(), reducedResults.end());
	}

	return results;
}

vector<Result> testAccuracyReduce(int beaconNum, int trainSmpNum, int testSmpNum, FILE *fpTrain, FILE *fpTest, unordered_map<int, int> featureIdxMap, float unit, fpos_t positionTrain, fpos_t positionTest, int edgeID) {
	//rewind each time you loop
	fsetpos(fpTrain, &positionTrain);
	fsetpos(fpTest, &positionTest);

	vector<Result> results;

	Result* bestResult = NULL;
	unordered_map<int, int> bestMap = NULL;

	//for each element in featureIdxMap
    for(std::unordered_map<int, int>::iterator it = featureIdxMap.begin(); it != featureIdxMap.end(); ++it) {
		//create idxmap without it
		unordered_map<int, int> tmpMap = featureIdxMap;
		tmpMap.erase(it->first);

		//test single run
		Result* tmpResult = testAccuracySingleRun(tmpMap.size(), trainSmpNum, testSmpNum, *fpTrain, *fpTest, tmpMap, unit, edgeID);

		//if best results
		if(bestResult == NULL) {
			bestResult = tmpResult;
			bestMap = tmpMap;
		} else if(tmpResult.lessThan1 > bestResult.lessThan1) {
			bestResult = tmpResult;
			bestMap = tmpMap;
		}
    }

	//add best result to results
	results.push_back(*bestResult);

	//if not null reduce without it
	if(tmpMap.size() > 1) {
		vector<Result> reducedResults = testAccuracyReduce(tmpMap.size(), trainSmpNum, testSmpNum, *fpTrain, *fpTest, bestMap, unit, positionTrain, positionTest, edgeID) {
		results.insert(results.end(), reducedResults.begin(), reducedResults.end());
	}

	return results;
}

Result* testAccuracySingleRun(int beaconNum, int trainSmpNum, int testSmpNum, FILE *fpTrain, FILE *fpTest, unordered_map<int, int> featureIdxMap, float unit, int edgeID) {
	// load training data to build kd-tree
    cv::flann::Index kdTree;
    cv::Mat trainPosMat;
    cv::Mat trainFeatMat;
    trainPosMat.create(trainSmpNum, 2, CV_32F);
    trainFeatMat.create(trainSmpNum, beaconNum, CV_32F);
    for (int i = 0; i < trainSmpNum; i++) {
        float x, y;
        int validBeaconNum;
        fscanf(fpTrain, "%f,%f,%d,", &x, &y, &validBeaconNum);
        trainPosMat.at<float>(i,0) = x;
        trainPosMat.at<float>(i,1) = y;
        for (int j = 0; j < beaconNum; j++) {
            trainFeatMat.at<float>(i, j) = -100.0;
        }
        for (int j = 0; j < validBeaconNum; j++) {
            int id, rssi, indx;
            fscanf(fpTrain, "65535,%d,%d,", &id, &rssi);
            indx = featureIdxMap[id];
            trainFeatMat.at<float>(i, indx) = rssi;
        }
    }
    kdTree.build(trainFeatMat, cv::flann::KDTreeIndexParams(TREE_NUM));

    // load testing data and get accuracy
    cv::Mat testFeatData;
    cv::Mat testPosData;
    testFeatData.create(testSmpNum, beaconNum, CV_32F);
    testPosData.create(testSmpNum, 2, CV_32F);

    vector<float> smp;
    smp.resize(beaconNum);
    vector<int> indices;
    indices.resize(KNN_NUM);
    vector<float> dists;
    dists.resize(KNN_NUM);


    Result* r = (Result*)calloc(1, sizeof(Result));

    r->testSmpNum = testSmpNum;
    r->unit = unit;
	r->beaconsUsed = featureIdxMap;
	r->edgeID = edgeID;


    // testing data without filtering
    vector<float> smpErrs;
    smpErrs.resize(testSmpNum);
    for (int i = 0; i < testSmpNum; i++) {
        for (int j = 0; j < beaconNum; j++) {
            testFeatData.at<float>(i, j) = -100;
            smp[j] = -100;
        }
        float x, y;
        int validBeaconNum;
        fscanf(fpTest, "%f,%f,%d,", &x, &y, &validBeaconNum);
        testPosData.at<float>(i, 0) = x;
        testPosData.at<float>(i, 1) = y;
        for (int j = 0; j < validBeaconNum; j++) {
            int id, rssi, indx;
            fscanf(fpTest, "65535,%d,%d,", &id, &rssi);
            indx = featureIdxMap[id];
            smp[indx] = rssi;
            testFeatData.at<float>(i, indx) = rssi;
        }

        kdTree.knnSearch(smp, indices, dists, KNN_NUM);
        r->aveDist = r->aveDist + (dists[0] - r->aveDist) / (i + 1);
        r->maxDist = MAX(r->maxDist, dists[0]);
        r->minDist = MIN(r->minDist, dists[0]);

        float estx = 0, esty = 0, curErr, distSum = 0;
        for (int j = 0; j < KNN_NUM; j++) {
            estx += trainPosMat.at<float>(indices[j], 0) / (dists[j] + 1e-20);
            esty += trainPosMat.at<float>(indices[j], 1) / (dists[j] + 1e-20);
            distSum += 1 / (dists[j] + 1e-20);
        }
        estx /= (distSum + 1e-20);
        esty /= (distSum + 1e-20);

        curErr = sqrt((x - estx) * (x - estx) + (y - esty) * (y - esty));
        //curErr = abs(y-esty);
        smpErrs[i] = curErr;
        r->minErr = MIN(curErr, r->minErr);
        if (curErr > r->maxErr) {
            r->worstX = x;
            r->worstY = y;
        }
        r->maxErr = MAX(curErr, r->maxErr);
        r->avgErr = r->avgErr + (curErr - r->avgErr) / (i + 1);
    }

    for (int i = 0; i < testSmpNum; i++) {
        if (smpErrs[i] < 1) {
            r->lessThan1++;
        }

        if (smpErrs[i] < 2) {
            r->lessThan2++;
        }

        if (smpErrs[i] < 3) {
            r->lessThan3++;
        }

        if (smpErrs[i] * 3 < KEY_ERR_METER * FEET_PER_METER) {
            r->lessThanKey++;
        }
    }

    fclose(fpTest);
    fclose(fpTrain);

    // clean memory
    trainPosMat.release();
    trainFeatMat.release();
    testPosData.release();
    testFeatData.release();
    kdTree.release();

    return r;
}

int getDataNumOfFeatureFile(const char *path) {
    FILE *fp = fopen(path, "r");
    char line[MAX_LINE_LENGTH];
    int lineCnt = 0;
    while (fgets(line, MAX_LINE_LENGTH, fp) != NULL) {
        lineCnt++;
    }
    fclose(fp);
    return lineCnt - 1;
}

void filtData(cv::Mat &mat, int bulkSize) {
    int bulkNum = mat.rows / bulkSize;
    for (int i = 0; i < bulkNum; i++) {
        int startRow = i * bulkSize;
        int endRow = (i + 1) * bulkSize - 1;
        for (int j = 0; j < mat.cols; j++) {
            int greatSignalNum = 0;
            int signalSum = 0;
            for (int k = startRow; k <= endRow; k++) {
                if (mat.at<float>(k, j) > -95) {
                    greatSignalNum++;
                    signalSum += mat.at<float>(k, j);
                }
            }
            if (greatSignalNum > 0.3 * bulkSize) {
                int signalMean = signalSum / greatSignalNum;
                for (int k = startRow; k <= endRow; k++) {
                    if (mat.at<float>(k, j) == -100) {
                        mat.at<float>(k, j) = signalMean;
                    }
                }
            }
        }

    }
}
