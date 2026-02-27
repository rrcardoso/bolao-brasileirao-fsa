export default function Sobre() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <img
          src="/logo.png"
          alt="Logo Bolão Brasileirão"
          className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl shadow-lg"
        />
        <h1 className="text-3xl font-extrabold text-gray-800">
          Bolão Brasileirão 2026
        </h1>
        <p className="text-gray-500">
          O bolão mais disputado de Formosa — GO
        </p>
      </div>

      {/* ===================== SOBRE O BOLÃO ===================== */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-gray-800 border-b-2 border-brand pb-2">
          Sobre o Bolão
        </h2>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          O Bolão Brasileirão é uma brincadeira entre amigos da cidade de{" "}
          <strong>Formosa — GO</strong>, onde cada participante escolhe 7 times
          do Campeonato Brasileiro Série A e acompanha a pontuação ao longo de
          toda a temporada. A entrada é de <strong>R$ 130,00</strong> por pessoa,
          sendo R$ 100,00 destinados à premiação e R$ 30,00 para a confraternização
          de fim de ano.
        </p>

        {/* Formosa */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📍</span> Formosa — GO
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 text-sm text-gray-600 leading-relaxed space-y-3">
              <p>
                Formosa é um município goiano localizado a 80 km de Brasília, com
                cerca de 115 mil habitantes. Conhecida por suas belezas naturais —
                como a <strong>Cachoeira do Itiquira</strong> (168m de queda livre),
                a <strong>Lagoa Feia</strong> e dezenas de sítios arqueológicos — a
                cidade é também um dos melhores pontos do Brasil para voo a vela.
              </p>
              <p>
                É nessa cidade que nasceu a tradição do nosso bolão, reunindo amigos
                apaixonados por futebol a cada temporada do Brasileirão.
              </p>
            </div>
            <div className="sm:w-48 shrink-0">
              <iframe
                title="Mapa de Formosa-GO"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122558.49785!2d-47.38!3d-15.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935a3a0a5b8e2e1b%3A0x5631e2b2e4f3e6!2sFormosa%2C%20GO!5e0!3m2!1spt-BR!2sbr"
                className="w-full h-40 sm:h-full rounded-lg border border-gray-200"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Regras */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📋</span> Regras
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-1">Entrada</p>
              <p className="text-sm text-gray-600">R$ 130,00 por participante</p>
              <p className="text-xs text-gray-400 mt-1">
                R$ 100 premiação + R$ 30 confraternização
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-1">Seleção</p>
              <p className="text-sm text-gray-600">
                Cada apostador escolhe 7 times com prioridade de 1 a 7
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-1">Pontuação</p>
              <p className="text-sm text-gray-600">
                Soma dos pontos dos 7 times no Brasileirão Série A
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 sm:col-span-2">
              <p className="font-semibold text-gray-700 mb-2">Critérios de Desempate</p>
              <p className="text-sm text-gray-600 mb-3">
                Se dois ou mais apostadores tiverem a mesma pontuação total, o desempate segue esta ordem:
              </p>
              <ol className="text-sm text-gray-600 space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <span><strong>Pontuação total</strong> — quem tiver mais pontos somados entre seus 7 times fica à frente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <span><strong>Pontuação por prioridade (1 a 7)</strong> — persistindo o empate, compara-se os pontos do time de prioridade 1 de cada apostador. Se ainda empatar, compara prioridade 2, depois 3, e assim por diante até a 7.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <span><strong>Ordem de inscrição</strong> — se ainda assim persistir o empate, quem se inscreveu primeiro leva vantagem.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SOBRE O APP ===================== */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-gray-800 border-b-2 border-brand pb-2">
          Sobre o App
        </h2>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Este sistema foi desenvolvido para consulta e acompanhamento em tempo real
          do ranking, substituindo planilhas manuais por uma aplicação web moderna
          e automatizada. O backend em Python consome dados ao vivo do Sofascore,
          enquanto o frontend em React oferece uma interface rica e responsiva.
        </p>

        {/* Stack */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Stack Tecnológica
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { name: "Python", desc: "Backend principal", color: "bg-yellow-100 text-yellow-800" },
              { name: "FastAPI", desc: "Framework REST", color: "bg-green-100 text-green-800" },
              { name: "SQLAlchemy", desc: "ORM / Banco", color: "bg-red-100 text-red-800" },
              { name: "SQLite", desc: "Banco de dados", color: "bg-blue-100 text-blue-800" },
              { name: "TypeScript", desc: "Frontend tipado", color: "bg-blue-100 text-blue-800" },
              { name: "React", desc: "Interface UI", color: "bg-cyan-100 text-cyan-800" },
              { name: "TailwindCSS", desc: "Estilização", color: "bg-sky-100 text-sky-800" },
              { name: "Vite", desc: "Build / Dev Server", color: "bg-purple-100 text-purple-800" },
              { name: "Recharts", desc: "Gráficos", color: "bg-pink-100 text-pink-800" },
              { name: "jsPDF", desc: "Exportação PDF", color: "bg-red-100 text-red-800" },
              { name: "SheetJS", desc: "Exportação Excel", color: "bg-green-100 text-green-800" },
              { name: "Poetry", desc: "Deps Python", color: "bg-indigo-100 text-indigo-800" },
              { name: "Pydantic", desc: "Validação", color: "bg-orange-100 text-orange-800" },
              { name: "JWT", desc: "Autenticação", color: "bg-amber-100 text-amber-800" },
              { name: "Sofascore API", desc: "Dados ao vivo", color: "bg-gray-100 text-gray-800" },
            ].map((tech) => (
              <div
                key={tech.name}
                className={`px-3 py-2 rounded-lg ${tech.color}`}
              >
                <span className="text-xs font-bold">{tech.name}</span>
                <span className="block text-[10px] opacity-75">{tech.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funcionalidades */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Funcionalidades
          </h3>
          <ul className="text-sm text-gray-600 space-y-1.5">
            {[
              "Ranking em tempo real com desempate por prioridade e ordem de inscrição",
              "Tabela da Classificação do Brasileirão com zonas coloridas",
              "Cadastro e edição de apostadores com seleção visual de times",
              "Histórico de pontuação por rodada com gráficos interativos",
              "Escudos oficiais dos times baixados do Sofascore",
              "Exportação de apostadores em Excel e ranking em PDF",
              "Painel administrativo protegido por autenticação JWT",
              "Sincronização automática de dados via Sofascore com fallback via scrape.do",
            ].map((feat) => (
              <li key={feat} className="flex items-start gap-2">
                <span className="text-brand mt-0.5">•</span>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Desenvolvedor */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold text-brand flex items-center gap-2">
          <span className="text-xl">👨‍💻</span> Desenvolvedor
        </h3>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center shrink-0">
            <span className="text-2xl font-extrabold text-brand">RC</span>
          </div>
          <div className="space-y-2">
            <div>
              <h4 className="font-bold text-gray-800 text-lg">
                Rodrigo Ribeiro Cardoso
              </h4>
              <p className="text-sm text-gray-500">
                Estatístico • Analista Logístico • Entusiasta de Programação, Automação &amp; Otimização
              </p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Formado em Estatística, atuo como analista de dados na área de logística.
              Apaixonado por programação, automação e otimização — seja de processos
              ou de projetos — desenvolvo soluções que unem dados, automação e boas
              interfaces para resolver problemas do dia a dia — como este bolão.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/rrcardoso"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/rodrigo-r-cardoso"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
