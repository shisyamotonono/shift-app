// =======================================
// 基本設定
// =======================================

// 全スタッフ共通の時給
const HOURLY_WAGE = 1300;


// =======================================
// データ読み込み
// =======================================

let staffList =
    JSON.parse(
        localStorage.getItem("staffList")
    ) || [];


let shifts =
    JSON.parse(
        localStorage.getItem("shifts")
    ) || [];


// =======================================
// 古いデータとの互換性
// =======================================

staffList = staffList.map(staff => ({
    ...staff,

    id:
        String(
            staff.id
        )
}));


shifts = shifts.map(shift => ({
    ...shift,

    id:
        String(
            shift.id
        ),

    staffId:
        String(
            shift.staffId
        ),

    // 時給は必ず1300円
    wage:
        HOURLY_WAGE,

    // 古いデータの場合
    transportPending:
        shift.transportPending ??
        (
            shift.transport === null ||
            shift.transport === undefined ||
            shift.transport === ""
        ),

    endPending:
        shift.endPending ??
        false,

    breakTime:
        Number(
            shift.breakTime || 0
        ),

    dailyMoney:
        shift.dailyMoney ??
        null
}));


saveStaffList();
saveShifts();


// =======================================
// ページ切り替え
// =======================================

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(element => {

            element
                .classList
                .remove("active");

        });


    document
        .querySelectorAll(
            ".bottom-nav button"
        )
        .forEach(button => {

            button
                .classList
                .remove("active");

        });


    const pageElement =
        document.getElementById(
            `page-${page}`
        );


    const navElement =
        document.getElementById(
            `nav-${page}`
        );


    if (pageElement) {

        pageElement
            .classList
            .add("active");

    }


    if (navElement) {

        navElement
            .classList
            .add("active");

    }


    if (
        page === "create"
    ) {

        displayShiftCreation();

    }


    if (
        page === "daily"
    ) {

        displayDailyShift();

    }


    if (
        page === "calendar"
    ) {

        displayCalendar();

    }


    if (
        page === "staff"
    ) {

        displayStaffList();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =======================================
// 古い「基本交通費」入力欄を非表示
// =======================================

function hideOldStaffTransportFields() {

    const transportInput =
        document.getElementById(
            "staffTransport"
        );


    const transportPending =
        document.getElementById(
            "staffTransportPending"
        );


    if (transportInput) {

        const label =
            document.querySelector(
                'label[for="staffTransport"]'
            );


        if (label) {

            label.style.display =
                "none";

        }


        transportInput.style.display =
            "none";

    }


    if (transportPending) {

        const checkboxArea =
            transportPending.closest(
                ".checkbox-area"
            );


        if (checkboxArea) {

            checkboxArea.style.display =
                "none";

        }

        else {

            transportPending.style.display =
                "none";

        }

    }
}


// =======================================
// 旧HTMLとの互換用
// =======================================

function toggleStaffTransportPending() {

    // 基本交通費は使わないため何もしない

}


// =======================================
// スタッフ追加
// =======================================

function addStaff() {

    const input =
        document.getElementById(
            "staffName"
        );


    if (!input) {

        return;

    }


    const name =
        input.value.trim();


    if (!name) {

        alert(
            "スタッフ名を入力してください"
        );

        return;

    }


    const exists =
        staffList.some(
            staff =>
                staff.name === name
        );


    if (exists) {

        alert(
            "同じ名前のスタッフが登録されています"
        );

        return;

    }


    // スタッフには名前だけ保存
    staffList.push({

        id:
            generateId(),

        name:
            name

    });


    saveStaffList();


    input.value =
        "";


    refreshAll();


    alert(
        "スタッフを登録しました"
    );
}


// =======================================
// スタッフ削除
// =======================================

function deleteStaff(staffId) {

    const staff =
        staffList.find(

            staff =>

                String(staff.id) ===
                String(staffId)

        );


    if (!staff) {

        return;

    }


    const result =
        confirm(

            `${staff.name}さんをスタッフ一覧から削除しますか？\n\n過去のシフトは残ります。`

        );


    if (!result) {

        return;

    }


    staffList =
        staffList.filter(

            staff =>

                String(staff.id) !==
                String(staffId)

        );


    saveStaffList();


    refreshAll();
}


// =======================================
// スタッフ保存
// =======================================

function saveStaffList() {

    localStorage.setItem(

        "staffList",

        JSON.stringify(
            staffList
        )

    );
}


// =======================================
// スタッフ一覧
// =======================================

function displayStaffList() {

    const area =
        document.getElementById(
            "staffList"
        );


    if (!area) {

        return;

    }


    area.innerHTML =
        "";


    if (
        staffList.length === 0
    ) {

        area.innerHTML = `

            <p class="empty">

                スタッフが登録されていません。

            </p>

        `;

        return;

    }


    staffList.forEach(staff => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "staff-row";


        row.innerHTML = `

            <div>

                <div
                    class="staff-name"
                >

                    ${escapeHTML(
                        staff.name
                    )}

                </div>

                <div
                    class="staff-sub"
                >

                    時給：¥${formatMoney(
                        HOURLY_WAGE
                    )}

                </div>

            </div>


            <button
                class="delete-btn"

                onclick="
                    deleteStaff(
                        '${staff.id}'
                    )
                "
            >

                削除

            </button>

        `;


        area.appendChild(
            row
        );

    });
}


// =======================================
// 過去の勤務場所一覧
// =======================================

function getSavedLocations() {

    return [

        ...new Set(

            shifts

                .map(
                    shift =>
                        (
                            shift.location ||
                            ""
                        )
                        .trim()
                )

                .filter(Boolean)

        )

    ].sort(

        (a, b) =>

            a.localeCompare(
                b,
                "ja"
            )

    );
}


// =======================================
// 勤務場所候補表示
// =======================================

function displayLocationSuggestions() {

    const datalist =
        document.getElementById(
            "locationSuggestions"
        );


    if (!datalist) {

        return;

    }


    datalist.innerHTML =
        "";


    getSavedLocations()
        .forEach(location => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                location;


            datalist.appendChild(
                option
            );

        });
}


// =======================================
// 日付ごとのスタッフ選択
// =======================================

function displayStaffSelect() {

    const select =
        document.getElementById(
            "addShiftStaff"
        );


    if (!select) {

        return;

    }


    const date =
        document.getElementById(
            "createDate"
        )?.value;


    select.innerHTML = `

        <option value="">

            スタッフを選択

        </option>

    `;


    staffList.forEach(staff => {

        const alreadyExists =
            shifts.some(

                shift =>

                    shift.date === date

                    &&

                    String(
                        shift.staffId
                    )

                    ===

                    String(
                        staff.id
                    )

            );


        if (alreadyExists) {

            return;

        }


        const option =
            document.createElement(
                "option"
            );


        option.value =
            String(
                staff.id
            );


        option.textContent =
            staff.name;


        select.appendChild(
            option
        );

    });
}


// =======================================
// 日付へスタッフ追加
// =======================================

function addStaffToDate() {

    const date =
        document.getElementById(
            "createDate"
        )?.value;


    const staffId =
        document.getElementById(
            "addShiftStaff"
        )?.value;


    if (!date) {

        alert(
            "勤務日を選択してください"
        );

        return;

    }


    if (!staffId) {

        alert(
            "スタッフを選択してください"
        );

        return;

    }


    const staff =
        staffList.find(

            staff =>

                String(staff.id) ===
                String(staffId)

        );


    if (!staff) {

        return;

    }


    const alreadyExists =
        shifts.some(

            shift =>

                shift.date === date

                &&

                String(
                    shift.staffId
                )

                ===

                String(
                    staffId
                )

        );


    if (alreadyExists) {

        alert(
            "このスタッフはすでに追加されています"
        );

        return;

    }


    // ===============================
    // 重要
    // 交通費は毎回未定からスタート
    // ===============================

    shifts.push({

        id:
            generateId(),

        staffId:
            String(
                staff.id
            ),

        name:
            staff.name,

        date:
            date,

        // 時給固定
        wage:
            HOURLY_WAGE,

        // 交通費は日ごとに登録
        transport:
            null,

        // 初期状態は未定
        transportPending:
            true,

        location:
            "",

        start:
            "",

        end:
            "",

        // 退勤も初期状態は未定
        endPending:
            true,

        breakTime:
            0,

        detail:
            "",

        dailyMoney:
            null

    });


    saveShifts();


    displayShiftCreation();

    displayDailyShift();

    displayCalendar();
}


// =======================================
// シフト作成画面
// =======================================

function displayShiftCreation() {

    const date =
        document.getElementById(
            "createDate"
        )?.value;


    const area =
        document.getElementById(
            "shiftCreationArea"
        );


    if (!area) {

        return;

    }


    displayStaffSelect();

    displayLocationSuggestions();


    area.innerHTML =
        "";


    if (!date) {

        area.innerHTML = `

            <div
                class="card empty"
            >

                日付を選択してください。

            </div>

        `;

        return;

    }


    const dailyShifts =
        shifts.filter(

            shift =>
                shift.date === date

        );


    if (
        dailyShifts.length === 0
    ) {

        area.innerHTML = `

            <div
                class="card empty"
            >

                この日のスタッフは
                まだ登録されていません。

            </div>

        `;

        return;

    }


    // 場所順に並べる
    dailyShifts.sort(

        (a, b) => {

            const locationA =
                a.location ||
                "zzzz";

            const locationB =
                b.location ||
                "zzzz";


            return (

                locationA.localeCompare(
                    locationB,
                    "ja"
                )

                ||

                a.name.localeCompare(
                    b.name,
                    "ja"
                )

            );

        }

    );


    dailyShifts.forEach(shift => {

        const shiftId =
            String(
                shift.id
            );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "card shift-entry";


        card.innerHTML = `

            <div
                class="shift-header"
            >

                <h3>

                    ${escapeHTML(
                        shift.name
                    )}

                </h3>


                <button

                    class="delete-btn"

                    onclick="
                        removeStaffFromDate(
                            '${shiftId}'
                        )
                    "

                >

                    この日から削除

                </button>

            </div>


            <!-- 時給固定 -->

            <div
                class="info-row"
            >

                <span
                    class="info-label"
                >

                    時給：

                </span>

                ¥${formatMoney(
                    HOURLY_WAGE
                )}

            </div>


            <!-- 交通費 -->

            <label>

                この日の交通費

            </label>


            <div
                class="checkbox-area"
            >

                <input

                    id="transportPending-${shiftId}"

                    type="checkbox"

                    ${
                        shift.transportPending
                        ?
                        "checked"
                        :
                        ""
                    }

                    onchange="
                        toggleTransportPending(
                            '${shiftId}'
                        )
                    "

                >


                <label

                    for="transportPending-${shiftId}"

                >

                    交通費は未定

                </label>

            </div>


            <input

                id="transport-${shiftId}"

                type="number"

                min="0"

                placeholder="例：500"

                value="${
                    shift.transportPending
                    ?
                    ""
                    :
                    (
                        shift.transport ??
                        ""
                    )
                }"

                ${
                    shift.transportPending
                    ?
                    "disabled"
                    :
                    ""
                }

                oninput="
                    updateDailyMoney(
                        '${shiftId}'
                    )
                "

            >


            <!-- 勤務場所 -->

            <label>

                勤務場所

            </label>


            <input

                id="location-${shiftId}"

                type="text"

                list="locationSuggestions"

                placeholder="例：横浜ホテル"

                value="${
                    escapeHTML(
                        shift.location ||
                        ""
                    )
                }"

            >


            <!-- 時間 -->

            <div
                class="flex"
            >


                <div>

                    <label>

                        出勤時間

                    </label>


                    <input

                        id="start-${shiftId}"

                        type="time"

                        value="${
                            shift.start ||
                            ""
                        }"

                        onchange="
                            updateDailyMoney(
                                '${shiftId}'
                            )
                        "

                    >

                </div>


                <div>

                    <label>

                        退勤時間

                    </label>


                    <input

                        id="end-${shiftId}"

                        type="time"

                        value="${
                            shift.end ||
                            ""
                        }"

                        ${
                            shift.endPending
                            ?
                            "disabled"
                            :
                            ""
                        }

                        onchange="
                            updateDailyMoney(
                                '${shiftId}'
                            )
                        "

                    >

                </div>


            </div>


            <div
                class="checkbox-area"
            >

                <input

                    id="endPending-${shiftId}"

                    type="checkbox"

                    ${
                        shift.endPending
                        ?
                        "checked"
                        :
                        ""
                    }

                    onchange="
                        toggleEndPending(
                            '${shiftId}'
                        )
                    "

                >


                <label
                    for="endPending-${shiftId}"
                >

                    退勤時間は未定

                </label>

            </div>


            <!-- 休憩 -->

            <label>

                休憩時間（分）

            </label>


            <input

                id="break-${shiftId}"

                type="number"

                min="0"

                value="${
                    shift.breakTime ??
                    0
                }"

                oninput="
                    updateDailyMoney(
                        '${shiftId}'
                    )
                "

            >


            <!-- 詳細 -->

            <label>

                詳細・メモ

            </label>


            <textarea

                id="detail-${shiftId}"

                rows="3"

                placeholder="例：婚礼、イベント受付など"

            >${escapeHTML(
                shift.detail ||
                ""
            )}</textarea>


            <!-- 金額 -->

            <div
                class="money-box"
            >

                自動計算


                <div

                    id="autoMoney-${shiftId}"

                    class="auto-money"

                >

                    未確定

                </div>


                <label>

                    その日の金額

                </label>


                <input

                    id="dailyMoney-${shiftId}"

                    type="number"

                    min="0"

                    value="${
                        shift.dailyMoney ??
                        ""
                    }"

                    placeholder="確定後に自動計算"

                >

            </div>

        `;


        area.appendChild(
            card
        );


        toggleTransportPending(
            shiftId,
            false
        );


        toggleEndPending(
            shiftId,
            false
        );


        updateDailyMoney(
            shiftId,
            false
        );

    });
}


// =======================================
// 交通費未定切り替え
// =======================================

function toggleTransportPending(
    shiftId,
    update = true
) {

    const checkbox =
        document.getElementById(
            `transportPending-${shiftId}`
        );


    const input =
        document.getElementById(
            `transport-${shiftId}`
        );


    if (
        !checkbox ||
        !input
    ) {

        return;

    }


    if (
        checkbox.checked
    ) {

        input.value =
            "";

        input.disabled =
            true;

    }

    else {

        input.disabled =
            false;

        input.focus();

    }


    if (update) {

        updateDailyMoney(
            shiftId
        );

    }
}


// =======================================
// 退勤未定切り替え
// =======================================

function toggleEndPending(
    shiftId,
    update = true
) {

    const checkbox =
        document.getElementById(
            `endPending-${shiftId}`
        );


    const input =
        document.getElementById(
            `end-${shiftId}`
        );


    if (
        !checkbox ||
        !input
    ) {

        return;

    }


    if (
        checkbox.checked
    ) {

        input.value =
            "";

        input.disabled =
            true;

    }

    else {

        input.disabled =
            false;

        input.focus();

    }


    if (update) {

        updateDailyMoney(
            shiftId
        );

    }
}


// =======================================
// 日額自動計算
// =======================================

function updateDailyMoney(
    shiftId,
    overwrite = true
) {

    const output =
        document.getElementById(
            `autoMoney-${shiftId}`
        );


    const moneyInput =
        document.getElementById(
            `dailyMoney-${shiftId}`
        );


    if (!output) {

        return;

    }


    const transportPending =
        document.getElementById(
            `transportPending-${shiftId}`
        )?.checked;


    const endPending =
        document.getElementById(
            `endPending-${shiftId}`
        )?.checked;


    // 交通費未定
    if (
        transportPending
    ) {

        output.textContent =
            "交通費未定";

        if (
            overwrite &&
            moneyInput
        ) {

            moneyInput.value =
                "";

        }

        return;

    }


    // 退勤時間未定
    if (
        endPending
    ) {

        output.textContent =
            "退勤時間未定";

        if (
            overwrite &&
            moneyInput
        ) {

            moneyInput.value =
                "";

        }

        return;

    }


    const transport =
        Number(

            document.getElementById(
                `transport-${shiftId}`
            )?.value || 0

        );


    const start =
        document.getElementById(
            `start-${shiftId}`
        )?.value;


    const end =
        document.getElementById(
            `end-${shiftId}`
        )?.value;


    const breakTime =
        Number(

            document.getElementById(
                `break-${shiftId}`
            )?.value || 0

        );


    if (
        !start ||
        !end
    ) {

        output.textContent =
            "未確定";

        return;

    }


    const total =
        calculateDailyMoney(

            HOURLY_WAGE,

            transport,

            start,

            end,

            breakTime

        );


    output.textContent =
        "¥" +
        formatMoney(
            total
        );


    if (
        overwrite &&
        moneyInput
    ) {

        moneyInput.value =
            total;

    }
}


// =======================================
// 日付からスタッフ削除
// =======================================

function removeStaffFromDate(
    shiftId
) {

    const shift =
        shifts.find(

            shift =>

                String(
                    shift.id
                )

                ===

                String(
                    shiftId
                )

        );


    if (!shift) {

        return;

    }


    const result =
        confirm(

            `${shift.name}さんを${formatDateJP(
                shift.date
            )}のシフトから削除しますか？\n\nスタッフ登録自体は削除されません。`

        );


    if (!result) {

        return;

    }


    shifts =
        shifts.filter(

            shift =>

                String(
                    shift.id
                )

                !==

                String(
                    shiftId
                )

        );


    saveShifts();

    refreshAll();
}


// =======================================
// この日のシフト保存
// =======================================

function saveDailyShifts() {

    const date =
        document.getElementById(
            "createDate"
        )?.value;


    if (!date) {

        alert(
            "勤務日を選択してください"
        );

        return;

    }


    const dailyShifts =
        shifts.filter(

            shift =>
                shift.date === date

        );


    if (
        dailyShifts.length === 0
    ) {

        alert(
            "この日のスタッフを追加してください"
        );

        return;

    }


    // 一度全部検証してから保存する
    const updates =
        [];


    for (
        const shift
        of dailyShifts
    ) {

        const shiftId =
            String(
                shift.id
            );


        const transportPending =
            document.getElementById(
                `transportPending-${shiftId}`
            )?.checked || false;


        const transport =
            transportPending
            ?
            null
            :
            Number(

                document.getElementById(
                    `transport-${shiftId}`
                )?.value || 0

            );


        const location =
            document.getElementById(
                `location-${shiftId}`
            )?.value.trim() || "";


        const start =
            document.getElementById(
                `start-${shiftId}`
            )?.value || "";


        const endPending =
            document.getElementById(
                `endPending-${shiftId}`
            )?.checked || false;


        const end =
            endPending
            ?
            ""
            :
            (
                document.getElementById(
                    `end-${shiftId}`
                )?.value || ""
            );


        const breakTime =
            Number(

                document.getElementById(
                    `break-${shiftId}`
                )?.value || 0

            );


        const detail =
            document.getElementById(
                `detail-${shiftId}`
            )?.value.trim() || "";


        // ===============================
        // 入力チェック
        // ===============================

        if (!location) {

            alert(

                `${shift.name}さんの勤務場所を入力してください`

            );

            return;

        }


        if (!start) {

            alert(

                `${shift.name}さんの出勤時間を入力してください`

            );

            return;

        }


        if (
            !endPending &&
            !end
        ) {

            alert(

                `${shift.name}さんの退勤時間を入力するか、「退勤時間は未定」にしてください`

            );

            return;

        }


        // ===============================
        // 日額計算
        // ===============================

        let dailyMoney =
            null;


        if (
            !transportPending &&
            !endPending
        ) {

            dailyMoney =
                calculateDailyMoney(

                    HOURLY_WAGE,

                    transport,

                    start,

                    end,

                    breakTime

                );


            // 手動入力されている場合
            const manualMoney =
                document.getElementById(
                    `dailyMoney-${shiftId}`
                )?.value;


            if (
                manualMoney !== undefined &&
                manualMoney !== null &&
                manualMoney !== ""
            ) {

                dailyMoney =
                    Number(
                        manualMoney
                    );

            }

        }


        updates.push({

            shift:
                shift,

            data: {

                wage:
                    HOURLY_WAGE,

                transport:
                    transport,

                transportPending:
                    transportPending,

                location:
                    location,

                start:
                    start,

                end:
                    end,

                endPending:
                    endPending,

                breakTime:
                    breakTime,

                detail:
                    detail,

                dailyMoney:
                    dailyMoney

            }

        });

    }


    // 全員入力OKならまとめて保存
    updates.forEach(item => {

        Object.assign(

            item.shift,

            item.data

        );

    });


    saveShifts();


    const dailyDate =
        document.getElementById(
            "dailyDate"
        );


    if (dailyDate) {

        dailyDate.value =
            date;

    }


    const calendarMonth =
        document.getElementById(
            "calendarMonth"
        );


    if (calendarMonth) {

        calendarMonth.value =
            date.substring(
                0,
                7
            );

    }


    refreshAll();


    alert(

        `${formatDateJP(
            date
        )}のシフトを保存しました`

    );
}


// =======================================
// 日別確認
// 勤務場所ごとにグループ分け
// =======================================

function displayDailyShift() {

    const date =
        document.getElementById(
            "dailyDate"
        )?.value;


    const area =
        document.getElementById(
            "dailyShiftArea"
        );


    if (!area) {

        return;

    }


    area.innerHTML =
        "";


    if (!date) {

        area.innerHTML = `

            <div
                class="card empty"
            >

                日付を選択してください。

            </div>

        `;

        return;

    }


    const dailyShifts =
        shifts

            .filter(

                shift =>
                    shift.date === date

            )

            .sort(

                (a, b) =>

                    (
                        a.start ||
                        ""
                    )
                    .localeCompare(
                        b.start ||
                        ""
                    )

            );


    if (
        dailyShifts.length === 0
    ) {

        area.innerHTML = `

            <div
                class="card empty"
            >

                ${formatDateJP(
                    date
                )}のシフトはありません。

            </div>

        `;

        return;

    }


    // ===============================
    // 場所ごとにグループ化
    // ===============================

    const groups =
        {};


    dailyShifts.forEach(shift => {

        const location =
            (
                shift.location ||
                ""
            )
            .trim()
            ||
            "勤務場所未設定";


        if (
            !groups[
                location
            ]
        ) {

            groups[
                location
            ] =
                [];

        }


        groups[
            location
        ]
        .push(
            shift
        );

    });


    const locationNames =
        Object.keys(
            groups
        );


    // ===============================
    // 全体概要
    // ===============================

    const summary =
        document.createElement(
            "div"
        );


    summary.className =
        "card";


    summary.innerHTML = `

        <strong>

            ${formatDateJP(
                date
            )}

        </strong>

        <br><br>

        登録人数：

        <strong>
            ${dailyShifts.length}人
        </strong>

        <br>

        勤務場所：

        <strong>
            ${locationNames.length}か所
        </strong>

        <br>

        時給：

        <strong>
            ¥${formatMoney(
                HOURLY_WAGE
            )}
        </strong>

    `;


    area.appendChild(
        summary
    );


    let entireTotal =
        0;


    // ===============================
    // 場所別表示
    // ===============================

    locationNames

        .sort(

            (a, b) =>

                a.localeCompare(
                    b,
                    "ja"
                )

        )

        .forEach(location => {

            const groupShifts =
                groups[
                    location
                ];


            let groupTotal =
                0;


            let pendingCount =
                0;


            groupShifts.forEach(shift => {

                if (
                    shift.dailyMoney !== null &&
                    shift.dailyMoney !== undefined
                ) {

                    groupTotal +=
                        Number(
                            shift.dailyMoney
                        );


                    entireTotal +=
                        Number(
                            shift.dailyMoney
                        );

                }


                if (
                    shift.transportPending ||
                    shift.endPending
                ) {

                    pendingCount++;

                }

            });


            const section =
                document.createElement(
                    "section"
                );


            section.className =
                "location-group";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "location-group-header";


            header.innerHTML = `

                <h3>

                    📍
                    ${escapeHTML(
                        location
                    )}

                </h3>


                <div
                    class="location-summary"
                >

                    ${groupShifts.length}人

                    ／

                    確定金額
                    ¥${formatMoney(
                        groupTotal
                    )}

                    ${
                        pendingCount > 0

                        ?

                        ` ／ 未確定 ${pendingCount}人`

                        :

                        ""
                    }

                </div>

            `;


            const body =
                document.createElement(
                    "div"
                );


            body.className =
                "location-group-body";


            groupShifts.forEach(shift => {

                const transportText =
                    shift.transportPending
                    ?
                    "未定"
                    :
                    "¥" +
                    formatMoney(
                        shift.transport
                    );


                const endText =
                    shift.endPending
                    ?
                    "未定"
                    :
                    (
                        shift.end ||
                        "-"
                    );


                const workTime =
                    shift.endPending
                    ?
                    "未確定"
                    :
                    calculateWorkTime(

                        shift.start,

                        shift.end,

                        shift.breakTime

                    );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "day-card";


                card.innerHTML = `

                    <div
                        class="day-name"
                    >

                        ${escapeHTML(
                            shift.name
                        )}

                    </div>


                    <div
                        class="info-row"
                    >

                        <span
                            class="info-label"
                        >
                            勤務時間：
                        </span>

                        ${
                            shift.start ||
                            "-"
                        }

                        ～

                        ${endText}

                    </div>


                    <div
                        class="info-row"
                    >

                        <span
                            class="info-label"
                        >
                            実働：
                        </span>

                        ${workTime}

                    </div>


                    <div
                        class="info-row"
                    >

                        <span
                            class="info-label"
                        >
                            時給：
                        </span>

                        ¥${formatMoney(
                            HOURLY_WAGE
                        )}

                    </div>


                    <div
                        class="info-row"
                    >

                        <span
                            class="info-label"
                        >
                            交通費：
                        </span>

                        ${transportText}

                    </div>


                    <div
                        class="info-row"
                    >

                        <span
                            class="info-label"
                        >
                            休憩：
                        </span>

                        ${
                            shift.breakTime ||
                            0
                        }分

                    </div>


                    <div
                        class="info-row"
                    >

                        <span
                            class="info-label"
                        >
                            詳細：
                        </span>

                        ${escapeHTML(
                            shift.detail ||
                            "-"
                        )}

                    </div>


                    ${
                        shift.transportPending ||
                        shift.endPending

                        ?

                        `

                            <div
                                class="pending"
                            >

                                ${
                                    shift.transportPending
                                    ?
                                    "交通費未定"
                                    :
                                    ""
                                }

                                ${
                                    shift.transportPending &&
                                    shift.endPending
                                    ?
                                    "・"
                                    :
                                    ""
                                }

                                ${
                                    shift.endPending
                                    ?
                                    "退勤時間未定"
                                    :
                                    ""
                                }

                            </div>

                        `

                        :

                        ""
                    }


                    <div
                        class="money-box"
                    >

                        その日の金額


                        <div
                            class="auto-money"
                        >

                            ${
                                shift.dailyMoney === null ||
                                shift.dailyMoney === undefined

                                ?

                                "未確定"

                                :

                                "¥" +
                                formatMoney(
                                    shift.dailyMoney
                                )
                            }

                        </div>

                    </div>


                    <div
                        class="action-row"
                    >

                        <button

                            class="gray-btn"

                            onclick="
                                editDailyShift(
                                    '${shift.id}'
                                )
                            "

                        >

                            編集

                        </button>


                        <button

                            class="delete-btn"

                            onclick="
                                removeStaffFromDate(
                                    '${shift.id}'
                                )
                            "

                        >

                            この日から削除

                        </button>

                    </div>

                `;


                body.appendChild(
                    card
                );

            });


            section.appendChild(
                header
            );


            section.appendChild(
                body
            );


            area.appendChild(
                section
            );

        });


    // ===============================
    // 全体金額
    // ===============================

    const totalBox =
        document.createElement(
            "div"
        );


    totalBox.className =
        "total-box";


    totalBox.innerHTML = `

        この日の確定金額合計

        <br>

        <strong>

            ¥${formatMoney(
                entireTotal
            )}

        </strong>

    `;


    area.appendChild(
        totalBox
    );
}


// =======================================
// 日別から編集
// =======================================

function editDailyShift(
    shiftId
) {

    const shift =
        shifts.find(

            shift =>

                String(
                    shift.id
                )

                ===

                String(
                    shiftId
                )

        );


    if (!shift) {

        return;

    }


    document.getElementById(
        "createDate"
    ).value =
        shift.date;


    showPage(
        "create"
    );
}


// =======================================
// 前日・翌日
// =======================================

function moveDailyDate(
    amount
) {

    const input =
        document.getElementById(
            "dailyDate"
        );


    if (
        !input ||
        !input.value
    ) {

        return;

    }


    const date =
        new Date(

            `${input.value}T00:00:00`

        );


    date.setDate(

        date.getDate() +
        amount

    );


    input.value =
        getLocalDateString(
            date
        );


    displayDailyShift();
}


// =======================================
// カレンダー
// =======================================

function displayCalendar() {

    const month =
        document.getElementById(
            "calendarMonth"
        )?.value;


    const calendar =
        document.getElementById(
            "calendar"
        );


    if (
        !month ||
        !calendar
    ) {

        return;

    }


    calendar.innerHTML =
        "";


    const [
        yearText,
        monthText
    ] =
        month.split("-");


    const year =
        Number(
            yearText
        );


    const monthNumber =
        Number(
            monthText
        );


    const weekNames = [
        "日",
        "月",
        "火",
        "水",
        "木",
        "金",
        "土"
    ];


    weekNames.forEach(week => {

        const header =
            document.createElement(
                "div"
            );


        header.className =
            "calendar-header";


        header.textContent =
            week;


        calendar.appendChild(
            header
        );

    });


    const firstDay =
        new Date(

            year,

            monthNumber - 1,

            1

        ).getDay();


    const numberOfDays =
        new Date(

            year,

            monthNumber,

            0

        ).getDate();


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "calendar-day empty-day";


        calendar.appendChild(
            empty
        );

    }


    const today =
        getLocalDateString(
            new Date()
        );


    for (
        let day = 1;
        day <= numberOfDays;
        day++
    ) {

        const date =

            `${year}-${String(
                monthNumber
            )
            .padStart(
                2,
                "0"
            )}-${String(
                day
            )
            .padStart(
                2,
                "0"
            )}`;


        const dailyShifts =
            shifts.filter(

                shift =>
                    shift.date === date

            );


        let totalMoney =
            0;


        dailyShifts.forEach(shift => {

            if (
                shift.dailyMoney !== null &&
                shift.dailyMoney !== undefined
            ) {

                totalMoney +=
                    Number(
                        shift.dailyMoney
                    );

            }

        });


        const hasPending =
            dailyShifts.some(

                shift =>

                    shift.transportPending

                    ||

                    shift.endPending

            );


        const locations = [

            ...new Set(

                dailyShifts

                    .map(

                        shift =>

                            (
                                shift.location ||
                                ""
                            )
                            .trim()

                    )

                    .filter(
                        Boolean
                    )

            )

        ];


        let locationText =
            "";


        if (
            locations.length === 1
        ) {

            locationText =
                locations[0];

        }

        else if (
            locations.length > 1
        ) {

            locationText =
                `${locations.length}か所`;

        }


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        if (
            date === today
        ) {

            cell.classList.add(
                "today"
            );

        }


        cell.innerHTML = `

            <div
                class="calendar-date"
            >

                ${day}

            </div>


            ${
                dailyShifts.length > 0

                ?

                `

                    <div
                        class="calendar-count"
                    >

                        ${dailyShifts.length}人

                    </div>


                    <div
                        class="calendar-location"
                    >

                        ${escapeHTML(
                            locationText
                        )}

                    </div>


                    <div
                        class="calendar-money"
                    >

                        ¥${formatMoney(
                            totalMoney
                        )}

                    </div>


                    ${
                        hasPending

                        ?

                        `

                            <div
                                class="calendar-pending"
                            >

                                未確定あり

                            </div>

                        `

                        :

                        ""
                    }

                `

                :

                ""
            }

        `;


        cell.onclick =
            function() {

                openDailyDate(
                    date
                );

            };


        calendar.appendChild(
            cell
        );

    }
}


// =======================================
// 前月・翌月
// =======================================

function moveCalendarMonth(
    amount
) {

    const input =
        document.getElementById(
            "calendarMonth"
        );


    if (
        !input ||
        !input.value
    ) {

        return;

    }


    const [
        year,
        month
    ] =
        input.value
            .split("-")
            .map(Number);


    const date =
        new Date(

            year,

            month - 1 + amount,

            1

        );


    input.value =

        `${date.getFullYear()}-${String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        )}`;


    displayCalendar();
}


// =======================================
// カレンダー→日別
// =======================================

function openDailyDate(
    date
) {

    const dailyDate =
        document.getElementById(
            "dailyDate"
        );


    if (dailyDate) {

        dailyDate.value =
            date;

    }


    showPage(
        "daily"
    );
}


// =======================================
// 日額計算
// =======================================

function calculateDailyMoney(

    wage,

    transport,

    start,

    end,

    breakTime

) {

    const minutes =
        calculateWorkMinutes(

            start,

            end,

            breakTime

        );


    return Math.round(

        minutes /
        60 *
        wage

        +

        Number(
            transport || 0
        )

    );
}


// =======================================
// 実働時間（分）
// =======================================

function calculateWorkMinutes(

    start,

    end,

    breakTime

) {

    if (
        !start ||
        !end
    ) {

        return 0;

    }


    const [
        startHour,
        startMinute
    ] =
        start
            .split(":")
            .map(Number);


    const [
        endHour,
        endMinute
    ] =
        end
            .split(":")
            .map(Number);


    let startMinutes =

        startHour *
        60

        +

        startMinute;


    let endMinutes =

        endHour *
        60

        +

        endMinute;


    // 日をまたぐ勤務
    // 例：22:00 ～ 02:00

    if (
        endMinutes <
        startMinutes
    ) {

        endMinutes +=

            24 *
            60;

    }


    let total =

        endMinutes

        -

        startMinutes

        -

        Number(
            breakTime || 0
        );


    if (
        total < 0
    ) {

        total =
            0;

    }


    return total;
}


// =======================================
// 実働時間表示
// =======================================

function calculateWorkTime(

    start,

    end,

    breakTime

) {

    const minutes =
        calculateWorkMinutes(

            start,

            end,

            breakTime

        );


    const hours =
        Math.floor(

            minutes /
            60

        );


    const rest =
        minutes %
        60;


    return (

        `${hours}時間${rest}分`

    );
}


// =======================================
// シフト保存
// =======================================

function saveShifts() {

    localStorage.setItem(

        "shifts",

        JSON.stringify(
            shifts
        )

    );
}


// =======================================
// 全画面更新
// =======================================

function refreshAll() {

    displayStaffList();

    displayShiftCreation();

    displayDailyShift();

    displayCalendar();

}


// =======================================
// 金額表示
// =======================================

function formatMoney(
    value
) {

    return Number(

        value || 0

    )
    .toLocaleString(
        "ja-JP"
    );
}


// =======================================
// 日付表示
// =======================================

function formatDateJP(
    date
) {

    if (!date) {

        return "";

    }


    const [
        year,
        month,
        day
    ] =
        date.split("-");


    return (

        `${year}年${Number(
            month
        )}月${Number(
            day
        )}日`

    );
}


// =======================================
// ローカル日付
// =======================================

function getLocalDateString(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return (

        `${year}-${month}-${day}`

    );
}


// =======================================
// ID生成
// =======================================

function generateId() {

    if (
        typeof crypto !==
        "undefined"

        &&

        typeof crypto.randomUUID ===
        "function"
    ) {

        return crypto.randomUUID();

    }


    return (

        Date.now()
            .toString()

        +

        "-"

        +

        Math.random()
            .toString(36)
            .slice(2)

    );
}


// =======================================
// HTML安全化
// =======================================

function escapeHTML(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// =======================================
// 初期表示
// =======================================

window.onload =
function() {

    // 古いHTMLにある基本交通費欄を隠す
    hideOldStaffTransportFields();


    const today =
        getLocalDateString(
            new Date()
        );


    const month =
        today.substring(
            0,
            7
        );


    const createDate =
        document.getElementById(
            "createDate"
        );


    const dailyDate =
        document.getElementById(
            "dailyDate"
        );


    const calendarMonth =
        document.getElementById(
            "calendarMonth"
        );


    if (createDate) {

        createDate.value =
            today;

    }


    if (dailyDate) {

        dailyDate.value =
            today;

    }


    if (calendarMonth) {

        calendarMonth.value =
            month;

    }


    refreshAll();
};