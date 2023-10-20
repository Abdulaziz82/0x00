

const dataBaseBaseURL = "";
const fetchBaseURL = "";
const usernameIDBaseURL = "";
const baseURL = "";


const data_get_tag = (_, e) => {
    var t = _.split("{");
    var T = "";
    for (var E = 0; E < t.length; E++) {
        if (t[E].substr(0, e.length) == e) {
            T = t[E].split("}")[1];
            break;
        }
    }
    return T;
}


const toUTF8Array = (t) => {
    let T = [];
    for (let e = 0; e < t.length; e++) {
        let _ = t.charCodeAt(e);
        if (_ < 128) {
            T.push(_);
        } else if (_ < 2048) {
            T.push(192 | _ >> 6, 128 | 63 & _);
        } else if (_ < 55296 || 57344 <= _) {
            T.push(224 | _ >> 12, 128 | _ >> 6 & 63, 128 | 63 & _);
        } else {
            e++;
            _ = 65536 + ((1023 & _) << 10 | 1023 & t.charCodeAt(e));
            T.push(240 | _ >> 18, 128 | _ >> 12 & 63, 128 | _ >> 6 & 63, 128 | 63 & _);
        }
    }
    return T;
}


const zu_write_ByteArray = (_, e, t) => {
    for (var T = 0; T < t.length; T++) {
        _.setUint8(e + T, t[T]);
    }
}


const headers = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "access-control-allow-origin": baseURL,
    "content-type": "application/json",
    "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "userid": usernameIDBaseURL
}


const requestDataBase = (dataBase, prams) => {
    return new Promise((resolve, reject) => {
        var s = 2
        var a = `<invoke name=\"${dataBase}\" returntype=\"xml\"><arguments><string>|${prams}`;
        
        var K = toUTF8Array(a += "|</string></arguments></invoke>");
        var z = 8 + K.length;
        
        var a = new ArrayBuffer(z);
        var Z = new DataView(a);

        Z.setUint32(0, s, false);
        Z.setUint32(4, z, false);
        zu_write_ByteArray(Z, 8, K);
        
        var xhr = new XMLHttpRequest();
        
        xhr.open('POST', dataBaseBaseURL, true);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        xhr.send(Z);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText)
                } else {
                    reject(xhr.status)
                }
            }
        }
    })
}


const reportLoginStudent = async (classroomID, userID) => {
    const response = await fetch(`${fetchBaseURL}/dataGathering/users/logins`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            classroomId: classroomID,
            userId: userID
        })
    });

    return response.json();
}


const getReportId = async (schoolID, studentID) => {
    const response = await fetch(`${fetchBaseURL}/report/getUserReportId/${schoolID}_${studentID}`, {
        method: "GET"
    })

    return response.json();
}


const getAllActivity = async (classroomID, reportID) => {
    /* 
        // SH1612901004: this is the school ID, i dont think it will change
    */
    const response = await fetch(`${fetchBaseURL}/studentReport/getActivitiesDetails`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            classroomId: classroomID,
            reportId: reportID
        })
    });

    return response.json();
}


const addTimeStamp = async (classroomID, userID, activityID, duration) => {
    const response = await fetch(`${fetchBaseURL}/dataGathering/activities/timespent`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            classroomId: classroomID,
            userId: userID,
            activityId: activityID,
            durationInSeconds: duration
        })
    });

    return response.json();
}


const setActivityResults = async (classroomID, userID, activityID, grade) => {
    const response = await fetch(`${fetchBaseURL}/dataGathering/activities/results`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            classroomId: classroomID,
            userId: userID,
            activityId: activityID,
            grade: grade
        })
    });

    return response.status;
}


const solveActivities = (userName) => {
    const schoolID = "SH1612901004"
    let studentID;
    let classID;
    let reportID;
    let activityArray;

    requestDataBase("rxb_0010", `login_student|${userName}|monastir33`)
        .then((result) => {
            studentID = data_get_tag(result, "ID");
            classID = data_get_tag(result, "class_id");
            reportLoginStudent(`${schoolID}_${classID}`, `${schoolID}_${studentID}`)
            return getReportId(schoolID, studentID)
        })
        .then((result) => {
            reportID = result.reportId;
            return getAllActivity(`${schoolID}_${classID}`, reportID)
        })
        .then((result) => {
            const grade = 69;
            const duration = 180;
            activityArray = Object.keys(result);

            activityArray.map((activityID) => {
                addTimeStamp(`${schoolID}_${classID}`, `${schoolID}_${studentID}`, activityID, duration);
                Promise.all([
                    requestDataBase("rxb_0020", `upd_exe_was_saved|${classID}|${activityID}|${studentID}`),
                    requestDataBase("rxb_0020", `upd_stud_work_qma|${classID}|${activityID}|${studentID}|${grade}%`),
                    requestDataBase("rxb_0020", `upd_grade_data|${classID}|${activityID}|${studentID}|${grade}%|0|`)
                ]).then(async () => {
                    return setActivityResults(`${schoolID}_${classID}`, `${schoolID}_${studentID}`, activityID, grade)
                .then((e) => {
                    console.log("done", e)
                })
                }).catch((e) => {
                    console.log(e)
                })
            })
        })
}


solveActivities("USERNAME")
