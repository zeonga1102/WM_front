let img;
let is_clicked = false;
let index = 0;

let furniture_positions = [];

const cursor = document.createElement('img');


function add_furniture_position(myfurniture, pos_x, pos_y, is_left) {
    let new_furniture = {
        'myfurniture': parseInt(myfurniture),
        'pos_x': pos_x,
        'pos_y': pos_y,
        'is_left': is_left
    }

    furniture_positions[index] = new_furniture

    index++;
}


function add_new_furniture(e) {
    if(is_clicked) {
        cursor.remove();

        let left = e.offsetX - img.naturalWidth / 2;
        let top = e.offsetY - img.naturalHeight / 2;

        img.style.position = 'absolute';
        img.style.left = `${left}px`;
        img.style.top = `${top}px`;

        img.addEventListener('click', (e) => { remove_furniture(e) });
        img.setAttribute('id', index);

        add_furniture_position(img.getAttribute('value'), left, top, is_left)

        document.getElementById('room').appendChild(img);

        is_clicked = false;
    }
}


function remove_furniture(e) {
    e.target.remove();
    furniture_positions[parseInt(e.target.getAttribute('id'))] = null
}


function change_cursor(e) {
    if(is_clicked) {
        cursor.setAttribute('id', 'cursor');

        cursor.setAttribute('src', img.getAttribute('src'))

        cursor.style.position = 'absolute';

        cursor.style.left = `${e.offsetX - img.naturalWidth / 2}px`;
        cursor.style.top = `${e.offsetY - img.naturalHeight / 2}px`;

        document.getElementById('room').appendChild(cursor);
    }
}


let is_left = true

async function get_my_furniture() {
    const response = await fetch(`${backend_base_url}/myroom/test/`, {
        method: 'GET',
        headers: { Authorization: "Bearer " + localStorage.getItem("access") },
        withCredentials: true,
    })
        .then(response => response.json())
        .then(data => {
            for(let i = 0; i < data.my_furniture.length; i++) {
                let cur_furniture = data.my_furniture[i]['furniture']

                let furniture_button = document.createElement('button')

                let id = data.my_furniture[i]['id']

                furniture_button.addEventListener('click', () => {
                    img = document.createElement('img');
                    img.setAttribute('value', id)
                    is_left ? img.setAttribute('src', cur_furniture['url_left']) : img.setAttribute('src', cur_furniture['url_right']);
                    img.style.pointerEvents = 'none'
                    is_clicked = true

                    document.getElementById('remove_button').innerHTML = '지우기';
                    let room_childs = document.getElementById('room').childNodes
                    for(i=0; i<room_childs.length; i++)
                        room_childs[i].style.pointerEvents = 'none';
                })

                furniture_button.innerHTML = cur_furniture['name']

                document.getElementById('furniture_div').appendChild(furniture_button)
            }
        });
}


function click_edit_button(e) {
    let buttons_div = document.getElementById('buttons_div')

    if(e.target.innerHTML == '편집') {
        e.target.innerHTML = '완료'

        let rotate_button = document.createElement('button')
        rotate_button.setAttribute('id', 'rotate_button')
        rotate_button.innerHTML = '회전'
        rotate_button.addEventListener('click', () => {
            cursor.remove()
            is_left ? is_left = false : is_left = true
            is_clicked = false
        })

        let remove_button = document.createElement('button')
        remove_button.setAttribute('id', 'remove_button')
        remove_button.innerHTML = '지우기'
        remove_button.addEventListener('click', (e) => {
            let room_childs = document.getElementById('room').childNodes
            if(e.target.innerHTML == '지우기') {
                cursor.remove();
                is_clicked = false;
                e.target.innerHTML = '배치하기';
                for(i=0; i<room_childs.length; i++)
                    room_childs[i].style.pointerEvents = 'auto';
            }
            else {
                e.target.innerHTML = '지우기';
                for(i=0; i<room_childs.length; i++)
                    room_childs[i].style.pointerEvents = 'none';
            }
        })

        buttons_div.appendChild(rotate_button)
        buttons_div.appendChild(remove_button)
    
        get_my_furniture()
    }
    else {        
        save_room()
    }
}


async function load_room() {
    let owner_id = window.location.search.split('=')[1]
    const response = await fetch(`${backend_base_url}/myroom/room/${owner_id}/`, {
        method: 'GET',
        headers: { Authorization: "Bearer " + localStorage.getItem("access") },
        withCredentials: true,
    })
        .then(response => response.json())
        .then(data => {
            const room = document.getElementById('room');
            let receive_furniture_positions = data['furniture_positions']
            for(let i=0; i<receive_furniture_positions.length; i++) {
                let cur_furniture = receive_furniture_positions[i]

                let furniture = document.createElement('img');

                furniture.style.position = 'absolute';
                furniture.style.left = `${cur_furniture['pos_x']}px`
                furniture.style.top = `${cur_furniture['pos_y']}px`

                furniture.style.pointerEvents = 'none'
                
                furniture.addEventListener('click', (e) => { remove_furniture(e) })

                furniture.setAttribute('src', cur_furniture['myfurniture_url'])
                furniture.setAttribute('id', index)

                add_furniture_position(cur_furniture['myfurniture'], cur_furniture['pos_x'], cur_furniture['pos_y'], cur_furniture['is_left'])

                room.appendChild(furniture)
            }
        });
}


async function save_room() {
    furniture_positions = furniture_positions.filter((elem) => elem != null)

    const response = await fetch(`${backend_base_url}/myroom/test/`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('access'),
            Accept: "application/json",
            'Content-type': 'application/json'},
        withCredentials: true,
        body: JSON.stringify({'furniture_positions': furniture_positions})
    })
        .then(response => {
            if (response.status == 200) {
                window.location.reload()
            }
            
            if (response.status == 400) {
                alert(response.status)
            }
        });
}


window.onload = function () {
    load_room()

    document.getElementById("edit_button").addEventListener('click', (e) => {click_edit_button(e)});

    const room = document.getElementById('room');
    room.addEventListener('click', add_new_furniture)
    room.addEventListener('mousemove', change_cursor)
}