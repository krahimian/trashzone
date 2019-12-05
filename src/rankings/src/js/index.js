document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')
let week_one = moment('2019-08-27')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const parent = document.querySelector('main section.rankings')
function acr(s){
  var words, acronym, nextWord

  words = s.split(' ')
  acronym= ''
  index = 0
  while (index<words.length) {
    nextWord = words[index]
    acronym = acronym + nextWord.charAt(0)
    index = index + 1
  }
  return acronym
}

const start = moment('2018-09-04')
const weeks = 13
let markers = []
for (let i=1;i<=13;i++) {
  const base = moment(start).add(i, 'week')
  markers.push({
    date: new Date(base.hour(0)),
    label: `End of Week ${i}`
  })
  markers.push({
    date: new Date(base.add(1, 'day').hour(4)),
    label: 'Waivers clear'
  })
}

App.data('/power_rankings.json').get().success(({ standings, history, transactions }) => {
  parent.innerHTML = null

  console.log(transactions)
  console.log(standings)
  console.log(history)
  const sorted_standings = standings.sort((a, b) => {
    const p = b.playoff_odds - a.playoff_odds

    if (p) {
      return p
    }

    const f = b.first_round_bye_odds - a.first_round_bye_odds

    if (f) {
      return f
    }

    return b.championship_odds - a.championship_odds
  })

  sorted_standings.forEach((team, index) => {

    const html = `
      <div class='heading'>
        <div class='team-name'>
          <small>${index+1}.</small> ${team.team}<small>${team.projected_wins}-${team.projected_losses}-${team.projected_ties}</small>
        </div>
        <div class='stat-container'>
          <div class='stat'>
            <div class='stat-heading'><span>wins</span></div>
            <div class='stat-value'>${team.avg_simulated_wins}</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>losses</span></div>
            <div class='stat-value'>${team.avg_simulated_losses}</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>projected points</span></div>
            <div class='stat-value'>${team.total_points}</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>make playoffs</span></div>
            <div class='stat-value'>${(team.playoff_odds * 100).toFixed(1)}%</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>1st-round bye</span></div>
            <div class='stat-value'>${(team.first_round_bye_odds * 100).toFixed(1)}%</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>win championship</span></div>
            <div class='stat-value'>${(team.championship_odds * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
      <div class='chart'></div>
    `

    Elem.create({
      className: 'team',
      attributes: {
        id: `team${team.team_id}`
      },
      parent: parent,
      html: html
    })

    const odds_history = history[team.team_id]

    let playoff_odds = []
    let championship_odds = []
    odds_history.forEach((item) => {
	  const date = new Date(item.date)
      playoff_odds.push({
        date: date,
        value: item.playoff
      })
      championship_odds.push({
        date: date,
        value: item.championship
      })
    })

    let events = []
    if (transactions && Object.keys(transactions[team.team_id]).length) {
      for (const timestamp in transactions[team.team_id]) {
        console.log(timestamp)
        const transaction = transactions[team.team_id][timestamp]
        events.push({
          date: new Date(moment(timestamp, 'ddd, MMM D h:m A')),
          label: transaction.type.split(/\s+/)[1]
        })
      }

      events = events.concat(markers)
    }

    MG.data_graphic({
	  data: [playoff_odds, championship_odds],
	  full_width: true,
	  format: 'percentage',
	  height: 200,
	  x_accessor: 'date',
	  y_accessor: 'value',
	  x_extended_ticks: true,
	  colors: ['#f05b4f', '#05b378'],
      area: [true, true],
      markers: events.length ? events : markers,
	  target: `#team${team.team_id} .chart`
    })
  })

}).error((message) => {
  console.error(message.error)
})
