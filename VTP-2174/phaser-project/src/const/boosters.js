// tile combination patterns

export default {
    swipe: {
    	'none': [],
        '4-horizontal': [{ h: 4, v: 1 }],
        '4-vertical': [{ h: 1, v: 4 }],
        'mixture': [{ h: 3, v: 3 }, { h: 3, v: 4 }, { h: 4, v: 3 }, { h: 2, v: 3 }, { h: 3, v: 2 }, { h: 2, v: 4 }, { h: 4, v: 2 }, { h: 2, v: 2 }],
        '5-in-a-line': [{ h: 5, v: 1 }, { h: 5, v: 1 }, { h: 5, v: 2 }, { h: 1, v: 5 }, { h: 1, v: 5 }, { h: 2, v: 5 }]
    }
}