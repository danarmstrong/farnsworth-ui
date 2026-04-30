import mock from '../../mockAdapter';

// types
export type KeyedObject = {
    [key: string]: string | number | KeyedObject | any;
};

const staffMembers: KeyedObject[] = [
    {
        id: '#123',
        userinfo: 'Hanna Gover',
        usermail: 'hgover@gmail.com',
        phone: '+123 456 789',
        jdate: '12-10-2014',
        role: 'Designer',
        rolestatus: 'primary'
    },
    {
        id: '#452',
        userinfo: 'Daniel Kristeen',
        usermail: 'hgover@gmail.com',
        phone: '+234 456 789',
        jdate: '10-09-2014',
        role: 'Developer',
        rolestatus: 'secondary'
    },
    {
        id: '#565',
        userinfo: 'Julian Josephs',
        usermail: 'hgover@gmail.com',
        phone: '+345 456 789',
        jdate: '01-10-2013',
        role: 'Accountant',
        rolestatus: 'error'
    },
    {
        id: '#785',
        userinfo: 'Jan Petrovic',
        usermail: 'hgover@gmail.com',
        phone: '+456 456 789',
        jdate: '02-10-2017',
        role: 'Designer',
        rolestatus: 'success'
    },
    {
        id: '#564',
        userinfo: 'Leanne Graham',
        usermail: 'hgover@gmail.com',
        phone: '+567 456 789',
        jdate: '10-9-2015',
        role: 'HR',
        rolestatus: 'info'
    },
    {
        id: '#980',
        userinfo: 'Mrs. Dennis Schulist',
        usermail: 'hgover@gmail.com',
        phone: '+678 456 789',
        jdate: '10-5-2013',
        role: 'Designer',
        rolestatus: 'warning'
    },
    {
        id: '#521',
        userinfo: 'Kurtis Weissnat',
        usermail: 'hgover@gmail.com',
        phone: '+123 456 789',
        jdate: '05-10-2012',
        role: 'Manager',
        rolestatus: 'primary'
    },
    {
        id: '#450',
        userinfo: 'Nicholas Runolfsdottir V',
        usermail: 'hgover@gmail.com',
        phone: '+234 456 789',
        jdate: '11-10-2014',
        role: 'Chairman',
        rolestatus: 'secondary'
    },
    {
        id: '#212',
        userinfo: 'Glenna Reichert',
        usermail: 'hgover@gmail.com',
        phone: '+345 456 789',
        jdate: '12-5-2017',
        role: 'Designer',
        rolestatus: 'error'
    },
    {
        id: '#152',
        userinfo: 'Clementina DuBuque',
        usermail: 'hgover@gmail.com',
        phone: '+456 456 789',
        jdate: '18-5-2009',
        role: 'Developer',
        rolestatus: 'success'
    }
];

// ==============================|| MOCK SERVICES ||============================== //

mock.onGet('/api/staff').reply(() => {
    return [200, staffMembers];
});

export default staffMembers;
