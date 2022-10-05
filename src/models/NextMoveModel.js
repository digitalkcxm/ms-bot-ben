export const NextMove = {
  esperar_resposta: 'esperar_resposta',
  pular_para: 'pular_para',
}

export default class NextMoveModel {
  static esperar_resposta = new NextMoveModel({ next_move: NextMove.esperar_resposta })
  static pular_para = new NextMoveModel({ next_move: NextMove.pular_para, params: { required: ['node_id'] } })

  constructor({ next_move, params }) {
    this.next_move = next_move
    this.params = params
  }


  async get() {
    return Object.keys(NextMoveModel).map(move => {
      return NextMoveModel[move]
    })
  }
}