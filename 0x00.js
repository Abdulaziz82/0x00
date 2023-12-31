

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


const dataBaseBaseURL = "";
const fetchBaseURL = "";
const usernameIDBaseURL = "";
const baseURL2 = "";

const headers = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "access-control-allow-origin": baseURL2,
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


const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


const solveActivities = (userName, manOfTheHour) => {
    const schoolID = "SH1612901004"
    let studentID;
    let classID;
    let reportID;
    let manOfTheHourStudentID;
    let manOfTheHourClassID;

    requestDataBase("rxb_0010", `login_student|${manOfTheHour}|monastir33`)
        .then((result) => {
            manOfTheHourStudentID = data_get_tag(result, "ID");
            manOfTheHourClassID = data_get_tag(result, "class_id");
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
                .then(async (result) => {
                    const duration = 180;
                    const activityArray = Object.keys(result).map((key) => ({
                        id: key,
                        ...result[key],
                    }));
                    const unsolvedActivities = activityArray.filter(activity => activity.complete !== "✓")
        
                    for (const activity of unsolvedActivities) {
                        const activityID = activity.id.split('_').slice(1).join('_');
                        requestDataBase("rxb_0010", `get_sql_generic|SELECT done, grade, stud_qma, stud_qwa, stud_freeform FROM xrb_studwork WHERE class_ID = '${manOfTheHourClassID}' AND stud_ID = '${manOfTheHourStudentID}' AND exe_ID = '${activityID}'`)
                            .then(async (result) => {
                                if (data_get_tag(result, "done") != "0") {
                                    const updObj = [
                                        {
                                            key: "qma",
                                            value: data_get_tag(result, "stud_qma"),
                                        },
                                        {
                                            key: "qwa",
                                            value: data_get_tag(result, "stud_qwa"),
                                        },
                                        {
                                            key: "freeform",
                                            value: data_get_tag(result, "stud_freeform")
                                        }
                                    ];
                                    const grade = parseInt(data_get_tag(result, "grade").replace("%", ""));
                                    const activityType = updObj.find(x => x.value !== "0");
                                    addTimeStamp(`${schoolID}_${classID}`, `${schoolID}_${studentID}`, activity.id, duration);
                                    if (activityType !== undefined || grade !== -1) {
                                        await Promise.all([
                                            requestDataBase("rxb_0020", `upd_exe_was_saved|${classID}|${activityID}|${studentID}`),
                                            requestDataBase("rxb_0020", `upd_stud_work_${activityType.key}|${classID}|${activityID}|${studentID}|${activityType.value}`),
                                            requestDataBase("rxb_0020", `upd_grade_data|${classID}|${activityID}|${studentID}|${grade}%|0|`),
                                            setActivityResults(`${schoolID}_${classID}`, `${schoolID}_${studentID}`, activity.id, grade)
                                        ])
                                    } else {
                                        await Promise.all([
                                            requestDataBase("rxb_0020", `upd_exe_was_saved|${classID}|${activityID}|${studentID}`),
                                            setActivityResults(`${schoolID}_${classID}`, `${schoolID}_${studentID}`, activity.id, grade)
                                        ])
                                    }
                                    console.log(`%c done: ${activityID}`, 'background: #222; color: #008000');
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                        await new Promise((resolve) => {
                            setTimeout(resolve, 1000);
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        })
        .catch((error) => {
            console.log(error);
        });
}




solveActivities("USER_NAME", "MAN_OF_THE_HOUR_USER_NAME")



// const solveActivities = (userName) => {
//     const schoolID = "SH1612901004"
//     let studentID;
//     let classID;
//     let reportID;
//     let activityArray;

//     requestDataBase("rxb_0010", `login_student|${userName}|monastir33`)
//         .then((result) => {
//             studentID = data_get_tag(result, "ID");
//             classID = data_get_tag(result, "class_id");
//             reportLoginStudent(`${schoolID}_${classID}`, `${schoolID}_${studentID}`)
//             return getReportId(schoolID, studentID)
//         })
//         .then((result) => {
//             reportID = result.reportId;
//             return getAllActivity(`${schoolID}_${classID}`, reportID)
//         })
//         .then(async (result) => {
//             const duration = 180;
//             activityArray = Object.keys(result);

//             for (const activityID of activityArray) {
//                 const parts = activityID.split('_');
//                 const activityIDString = parts.slice(1).join('_');
//                 const grade = getRandomInt(88, 100);
//                 await new Promise((resolve) => {
//                     setTimeout(resolve, 1000);
//                 });

//                 addTimeStamp(`${schoolID}_${classID}`, `${schoolID}_${studentID}`, activityID, duration);
//                 await Promise.all([
//                     requestDataBase("rxb_0020", `upd_exe_was_saved|${classID}|${activityIDString}|${studentID}`),
//                     requestDataBase("rxb_0020", `upd_stud_work_qma|${classID}|${activityIDString}|${studentID}|${grade}%`),
//                     requestDataBase("rxb_0020", `upd_grade_data|${classID}|${activityIDString}|${studentID}|${grade}%|0|`)
//                 ]);

//                 await setActivityResults(`${schoolID}_${classID}`, `${schoolID}_${studentID}`, activityID, grade);
//                 console.log("done", activityIDString);
//             }
//         })
//         .catch((error) => {
//             console.log(error);
//         });
// }
